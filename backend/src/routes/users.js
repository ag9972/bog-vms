// NPM Packages
const express = require('express');
const router = express.Router();
const { check, oneOf, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const mongoose = require('mongoose');

// Local Imports
const { SendEmailError, EmailInUseError } = require('../util/errors');
const UserData = require('../models/userData');
const { USER_DATA_VALIDATOR } = require('../util/validators');
const DEFAULT_PAGE_SIZE = 10;
//events

router.post('/', USER_DATA_VALIDATOR, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.mapped() });
  }
  const newUserData = matchedData(req);
  let userData = null;
  UserData.findOne({ 'bio.email': newUserData.bio.email })
    .then(user => {
      if (user) {
        throw new EmailInUseError(
          `Email ${newUserData.bio.email} already in use`,
          newUserData.bio.email
        );
      }
      return Promise.resolve();
    })
    .then(() => {
      const newUser = new UserData(newUserData);
      return newUser.save();
    })
    .then(savedUserData => {
      // Save data for response
      userData = savedUserData;

      if (req.user && !req.user.userDataId) {
        // First created user, associate with user credentials
        const userCreds = req.user;
        userCreds.userDataId = savedUserData.id;
        return userCreds.save();
      }

      return Promise.resolve();
    })
    .then(() => {
      res.status(200).json({ userData });
    })
    .catch(err => {
      if (err instanceof EmailInUseError) {
        return res.status(400).json({
          error: err.message,
          errorType: err.name
        });
      }

      // Generic error handler
      return next(err);
    });
});

// Contains the paths of search terms to perform textual search on
const searchTermPaths = {
  Bio: ['bio.first_name', 'bio.last_name'],
  Email: ['bio.email'],
  'Phone Number': ['bio.phone_number']
};

// Construct data structures for search term paths
const defaultSearchTermPaths = Object.values(searchTermPaths).reduce(
  (paths, entry) => paths.concat(entry),
  []
);
const searchTerms = new Set(Object.keys(searchTermPaths));

// Creates a simple aggregate operator factory that assumes filter group keys and
// values directly correspond with the field names and values from MongoDB
const simpleFilterOperatorFactory = groupKey => value => ({
  [groupKey]: value
});

// Map of filter group keys to functions that transform values to MongoDB Aggregation
// pipeline expression clauses.
// See https://docs.mongodb.com/manual/meta/aggregation-quick-reference/#aggregation-expressions
const filterValueToOperator = {
  // TODO modify to work with different format
  date: simpleFilterOperatorFactory('date'),
  status: simpleFilterOperatorFactory('status'),
  role: simpleFilterOperatorFactory('role'),
  // TODO modify to work with different format
  skills_interests: simpleFilterOperatorFactory('skills_interests')
};

// Added to fulfill requirements of UserManager page
router.get('/search', (req, res, next) => {
  const filter = {};
  const $and = [];
  const invalidParam = name =>
    res.status(400).json({ error: `Malformed request: invalid ${name} param` });

  // Search param is for textual search: { value: '', term: 'All' }
  if (req.query.search) {
    try {
      const search = JSON.parse(req.query.search);
      if (search != null && search.value != null && search.term != null) {
        const { term, value } = search;
        const regexquery = { $regex: new RegExp(value), $options: 'i' };
        const searchPaths = searchTerms.has(term)
          ? searchTermPaths[term]
          : defaultSearchTermPaths;
        // Add passing one of the textual search queries as a required condition for a
        // document to be returned
        $and.push({ $or: searchPaths.map(path => ({ [path]: regexquery })) });
      } else return invalidParam('search');
    } catch (err) {
      return invalidParam('search');
    }
  }

  // Query param is for boolean filtering: [ { key: "group1", values: { valueB: true } } ]
  if (req.query.filters) {
    try {
      const filters = JSON.parse(req.query.filters);
      if (
        filters != null &&
        typeof filters === 'object' &&
        Array.isArray(filters)
      ) {
        // Series of steps that must all pass for a document to be returned
        const filterPipelineStages = filters.map(({ key, values }) => ({
          $or: values.map(value => filterValueToOperator[key](value))
        }));
        $and.push(...filterPipelineStages);
      } else return invalidParam('filters');
    } catch (err) {
      return invalidParam('filters');
    }
  }

  // Attach if any filters are needed
  if ($and.length > 0) {
    filter.$and = $and;
  }

  const parsedLimit = parseInt(req.query.limit, 10);
  let limit = null;
  // limit = 0 means no limit
  if (parsedLimit !== 0) limit = parsedLimit || DEFAULT_PAGE_SIZE;
  const baseAggregateStages = [
    { $sort: { _id: -1 } },
    { $match: filter },
    {
      $project: {
        name: { $concat: ['$bio.first_name', ' ', '$bio.last_name'] },
        email: '$bio.email',
        role: 1,
        status: 1
      }
    }
  ];

  if (req.query.start) {
    // If pagination was supplied to the request, then do not load all users to count them
    filter._id = { $lt: mongoose.Types.ObjectId(req.query.start) };
    // Skip limit if not set
    const aggregateStages =
      limit == null
        ? baseAggregateStages
        : [...baseAggregateStages, { $limit: limit }];
    UserData.aggregate(aggregateStages)
      .then(users => res.status(200).json({ users }))
      .catch(err => next(err));
  } else {
    // Pagination not supplied, so determine the total count for initial request
    // See https://stackoverflow.com/a/49483919
    const facet = {
      $facet: {
        // Skip limit if not set, use empty match as pipeline without limit
        users: limit == null ? [{ $match: {} }] : [{ $limit: limit }],
        count: [{ $count: 'count' }]
      }
    };
    UserData.aggregate([...baseAggregateStages, facet])
      .then(result => {
        const [{ users, count: countResult }] = result;
        if (countResult.length === 0) {
          // Count was 0
          return res.status(200).json({ users, count: 0 });
        }

        const [{ count }] = countResult;
        return res.status(200).json({ users, count });
      })
      .catch(err => next(err));
  }
});

router.get('/', (req, res, next) => {
  const filter = {};
  if (req.query.type) {
    UserData.find({ role: req.query.type })
      .then(users => res.status(200).json({ users }))
      .catch(err => next(err));
  }
  if (req.query.status) {
    try {
      // Each role is sent as an object key
      // For mongo '$or' query, these keys need to be reduced to an array
      const statusFilter = Object.keys(JSON.parse(req.query.status)).reduce(
        (query, key) => [...query, { status: key }],
        []
      );
      if (!statusFilter.length) {
        res.status(400).json({ error: 'Invalid status param' });
      }
      filter.$or = statusFilter;
    } catch (e) {
      res.status(400).json({ error: 'Invalid status param' });
    }
  }
  if (req.query.role) {
    try {
      // Each role is sent as an object key
      // For mongo '$or' query, these keys need to be reduced to an array
      const roleFilter = Object.keys(JSON.parse(req.query.role)).reduce(
        (query, key) => [...query, { role: key }],
        []
      );
      if (!roleFilter.length) {
        res.status(400).json({ error: 'Invalid role param' });
      }
      filter.$or = roleFilter;
    } catch (e) {
      res.status(400).json({ error: 'Invalid role param' });
    }
  }
  if (req.query.date) {
    try {
      const dates = JSON.parse(req.query.date).reduce(
        (query, curr) => [
          ...query,
          { createdAt: { $gte: new Date(curr.from), $lte: new Date(curr.to) } }
        ],
        []
      );
      if (dates.length)
        filter.$or = filter.$or ? [...filter.$or, ...dates] : dates;
    } catch (e) {
      res.status(400).json({ error: 'Invalid date param' });
    }
  }
  if (req.query.availability) {
    try {
      filter.availability = JSON.parse(req.query.availability);
    } catch (e) {
      res.status(400).json({ error: 'Invalid availability param' });
    }
  }
  if (req.query.skills_interests) {
    try {
      filter.skills_interests = JSON.parse(req.query.skills_interests);
    } catch (e) {
      res.status(400).json({ error: 'Invalid skills_interests param' });
    }
  }
  if (req.query.lastPaginationId) {
    filter._id = { $lt: mongoose.Types.ObjectId(req.query.lastPaginationId) };
  }
  // Search ordered newest first, matching filters, limited by pagination size
  UserData.aggregate([
    { $sort: { _id: -1 } },
    { $match: filter },
    { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
  ])
    .then(users => {
      res.status(200).json({ users });
    })
    .catch(err => next(err));
});

router.get('/managementData', (req, res, next) => {
  const filter = {};
  if (req.query.role) {
    try {
      // Each role is sent as an object key
      // For mongo '$or' query, these keys need to be reduced to an array
      const roleFilter = Object.keys(JSON.parse(req.query.role)).reduce(
        (query, key) => [...query, { role: key }],
        []
      );
      if (!roleFilter.length) {
        res.status(400).json({ error: 'Invalid role param' });
      }
      filter.$or = roleFilter;
    } catch (e) {
      res.status(400).json({ error: 'Invalid role param' });
    }
  }
  if (req.query.lastPaginationId) {
    filter._id = { $lt: mongoose.Types.ObjectId(req.query.lastPaginationId) };
  }
  UserData.aggregate([
    { $sort: { _id: -1 } },
    { $match: filter },
    { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE },
    {
      $project: {
        name: { $concat: ['$bio.first_name', ' ', '$bio.last_name'] },
        email: '$bio.email',
        role: 1,
        status: 1
      }
    }
  ])
    .then(users => {
      res.status(200).json({ users });
    })
    .catch(err => next(err));
});

router.get('/count', (req, res, next) => {
  UserData.estimatedDocumentCount()
    .exec()
    .then(count => {
      res.status(200).json({ count });
    })
    .catch(err => next(err));
});

router.get('/searchByContent', (req, res, next) => {
  const inputText = req.query.searchquery;
  const searchType = req.query.searchtype;
  const regexquery = { $regex: new RegExp(inputText), $options: 'i' };
  const filter = {};

  switch (searchType) {
    case 'All':
      filter.$or = [
        { history: regexquery },
        { 'bio.street_address': regexquery },
        { 'bio.city': regexquery },
        { 'bio.state': regexquery },
        { 'bio.zip_code': regexquery },
        { 'bio.first_name': regexquery },
        { 'bio.last_name': regexquery },
        { 'bio.email': regexquery },
        { 'bio.phone_number': regexquery }
      ];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
      break;
    case 'Address':
      filter.$or = [
        { 'bio.street_address': regexquery },
        { 'bio.city': regexquery },
        { 'bio.state': regexquery },
        { 'bio.zip_code': regexquery }
      ];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
      break;
    case 'History':
      filter.$or = [
        { 'history.volunteer_interest_cause': regexquery },
        { 'history.volunteer_support': regexquery },
        { 'history.volunteer_commitment': regexquery },
        { 'history.previous_volunteer_experience': regexquery }
      ];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
      break;
    case 'Name':
      filter.$or = [
        { 'bio.first_name': regexquery },
        { 'bio.last_name': regexquery }
      ];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
      break;
    case 'History':
      UserData.find({
        $or: [
          { 'history.volunteer_interest_cause': regexquery },
          { 'history.volunteer_support': regexquery },
          { 'history.volunteer_commitment': regexquery },
          { 'history.previous_volunteer_experience': regexquery }
        ]
      })
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
      break;
    case 'Email':
      filter.$or = [{ 'bio.email': regexquery }];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => {
          res.status(200).json({ users });
        })
        .catch(err => next(err));
      break;
    case 'Phone Number':
      filter.$or = [{ 'bio.phone_number': regexquery }];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
      break;
    default:
      filter.$or = [
        { 'history.volunteer_interest_cause': regexquery },
        { 'history.volunteer_support': regexquery },
        { 'history.volunteer_commitment': regexquery },
        { 'history.previous_volunteer_experience': regexquery },
        { 'bio.street_address': regexquery },
        { 'bio.city': regexquery },
        { 'bio.state': regexquery },
        { 'bio.zip_code': regexquery },
        { 'bio.first_name': regexquery },
        { 'bio.last_name': regexquery },
        { 'bio.email': regexquery },
        { 'bio.phone_number': regexquery }
      ];
      UserData.aggregate([
        { $sort: { _id: -1 } },
        { $match: filter },
        { $limit: parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE }
      ])
        .then(users => res.status(200).json({ users }))
        .catch(err => next(err));
  }
});

router.post('/updateStatus', (req, res, next) => {
  if (!req.query.email || !req.query.status)
    res.status(400).json({ error: 'Invalid email or status sent' });
  const { email, status } = req.query;
  UserData.updateOne({ 'bio.email': email }, { $set: { status: status } }).then(
    result => {
      if (!result.nModified)
        res.status(400).json({
          error: 'Email requested for update was invalid. 0 items changed.'
        });
      res.sendStatus(200);
    }
  );
});

router.post('/updateRole', (req, res, next) => {
  if (!req.query.email || !req.query.role)
    res.status(400).json({ error: 'Invalid email or role sent' });
  const { email, role } = req.query;
  UserData.updateOne({ 'bio.email': email }, { $set: { role: role } }).then(
    result => {
      if (!result.nModified)
        res.status(400).json({
          error: 'Email requested for update was invalid. 0 items changed.'
        });
      res.sendStatus(200);
    }
  );
});

router
  .route('/:id')
  .get([check('id').isMongoId()], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.mapped() });
    }

    UserData.findById(req.params.id)
      .then(user => {
        if (!user) {
          return res
            .status(404)
            .json({ errors: `No User found with id: ${req.params.id}` });
        }
        res.status(200).json({ user });
      })
      .catch(err => next(err));
  })
  .put(
    [check('id').isMongoId()],
    oneOf(USER_DATA_VALIDATOR),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
      }

      const userDataReq = matchedData(req);
      const events = req.body.events;

      let savedUserData = null;
      UserData.findById(req.params.id)
        .then(user => {
          if (!user) {
            return res
              .status(404)
              .json({ errors: `No user found with id: ${req.params.id}` });
          }

          if (req.query.action === 'appendEvent') {
            events.forEach(eventId => user.events.push(eventId));
          } else if (req.query.action === 'removeEvents') {
            events.forEach(eventId =>
              user.events.splice(user.events.indexOf(eventId), 1)
            );
          }

          delete userDataReq.id; // we do not want to update the user's id
          updateUserObjectFromRequest(userDataReq, user);

          // Save to db
          return user.save();
        })
        .then(user => {
          return res.status(200).json({ user });
        })
        .catch(err => {
          if (err instanceof SendEmailError) {
            return res.status(400).json({
              error: err.message,
              errorType: err.name
            });
          }

          // Generic error handler
          return next(err);
        });
    }
  )
  .delete([check('id').isMongoId()], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.mapped() });
    }

    if (req.user && req.user.userDataId === req.params.id) {
      // User is trying to remove themselves, don't let that happen...
      return res.status(403).json({
        error: 'Cannot delete yourself!'
      });
    }

    UserData.findByIdAndRemove(req.params.id)
      .then(removed => {
        if (!removed) {
          return res
            .status(404)
            .json({ errors: `No user found with id: ${req.params.id}` });
        }

        return res.status(200).json({ removed });
      })
      .catch(err => next(err));
  });

/**
 * Side Affect: Modifies `dbUser`
 */
function updateUserObjectFromRequest(reqUser, dbUser) {
  for (const key1 in reqUser) {
    if (reqUser.hasOwnProperty(key1)) {
      const obj = reqUser[key1];
      const userObj = dbUser[key1];
      for (const key2 in obj) {
        if (obj.hasOwnProperty(key2)) {
          userObj[key2] = obj[key2] !== undefined ? obj[key2] : userObj[key2];
        }
      }
      dbUser[key1] = userObj;
    }
  }
}

module.exports = router;
