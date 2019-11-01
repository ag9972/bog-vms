const express = require('express');
const router = express.Router();
const { check, oneOf, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const EventData = require('../models/event');
const { EVENT_VALIDATOR } = require('../util/validators');

router.post('/', EVENT_VALIDATOR, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.mapped() });
  }
  const newEventData = matchedData(req);
  const newEvent = new EventData(newEventData);
  newEvent.id = newEvent._id.toString();
  // console.log(newEvent.id);
  newEvent
    .save()
    .then(() => {
      res.json({
        message: 'Event successfully created!'
      });
    })
    .catch(err => {
      next(err);
    });
});

router.get('/', (req, res, next) => {
  EventData.find({})
    .then(events => {
      res.status(200).json({
        events
      });
    })
    .catch(next);
});
// add search route with filter parms

router.delete('/', EVENT_VALIDATOR, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }
    let event = new EventData(matchedData(req));
    EventData.findOneAndDelete(
        {id : event.id}
    ).then(()=>
        res.json({
            message: 'Event successfully deleted!'
        })
    );
});

router.put('/', EVENT_VALIDATOR, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.mapped() });
    }
    // console.log(req);
    const updateEventData = matchedData(req);
    const editEvent = new EventData(updateEventData);
    EventData.findOneAndUpdate(
        {id : editEvent.id},
        {$set : updateEventData},
        function (err, obj) {
            if (err) console.log;
            else {
                console.log(obj);
            }
        }
    ).then(()=>
        res.json({
            message: 'Event successfully edited!'
        })
    ).catch(err => {
        next(err)
    });
});

module.exports = router;
