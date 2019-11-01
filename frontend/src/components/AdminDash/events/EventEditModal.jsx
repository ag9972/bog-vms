import React from 'react';
import styled from 'styled-components';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import { Formik, Form as FForm, Field, ErrorMessage } from 'formik';
import * as SForm from '../shared/formStyles';
import PropTypes from 'prop-types';
import { string, object, number, date } from 'yup';

/**this probably needs to change */
import { editEvent } from '../queries';

const Styled = {
  Form: styled(FForm)``,
  ErrorMessage: styled(ErrorMessage).attrs({
    component: 'span'
  })`
    ::before {
      content: '*';
    }
    color: red;
    font-size: 14px;
    font-weight: bold;
    display: inline-block;
  `
};

const EventValidator = object().shape({
  name: string()
    .trim()
    .required(),
  date: date().required(),
  location: string()
    .trim()
    .required(),
  description: string()
    .trim()
    .required(),
  contact_phone: string().trim(),
  contact_email: string()
    .email()
    .trim(),
  external_links: string()
    .url()
    .trim(),
  max_volunteers: number()
    .positive()
    .required()
});

const EventEditModal = ({ open, toggle, event }) => {
  let id = event ? event.id : "";
  return (
    <Modal isOpen={open} toggle={toggle}>
      <ModalHeader toggle={toggle}>Edit Event</ModalHeader>
      <Formik
        initialValues={{
          name: (event) ? event.name: '',
          date: (event) ? event.date.split("T")[0] : '',
          location: (event) ? event.location: '',
          description: (event) ? event.description: '',
          contact_phone: (event) ? event.contact_phone: '',
          contact_email: (event) ? event.email: '',
          max_volunteers: (event) ? event.max_volunteers: 0,
          external_links: (event) ? event.external_links: []
        }}
        onSubmit={(values, { setSubmitting }) => {
          values.id = id;
          const event = {
            ...values,
            contact_phone: values.contact_phone || undefined,
            contact_email: values.contact_email || undefined,
            external_links: values.external_links ? [values.external_links] : undefined
          };
          console.log(event);
          setSubmitting(true);
          editEvent(event)
            .then(() => toggle())
            //   .then(open => !open || console.log("here"))
            // .catch(console.log)
            // .finally(() => setSubmitting(false) || con1sole.log("abc"));
        }}
        validationSchema={EventValidator}
        render={({ handleSubmit, isValid, isSubmitting, values, setFieldValue, handleBlur}) => (
          <React.Fragment>
            <ModalBody>
              <Styled.Form>
                <SForm.FormGroup>
                  <SForm.Label>Name</SForm.Label>
                  <Styled.ErrorMessage name="name" />
                  <Field name="name">{({ field }) => <SForm.Input {...field} type="text" />}</Field>
                  <SForm.Label>Date</SForm.Label>
                  <Styled.ErrorMessage name="date" />
                  <Field name="date">{({ field }) => <SForm.Input {...field} type="date" />}</Field>
                  <SForm.Label>Location</SForm.Label>
                  <Styled.ErrorMessage name="location" />
                  <Field name="location">
                    {({ field }) => <SForm.Input {...field} type="text" />}
                  </Field>
                  <SForm.Label>Description</SForm.Label>
                  <Styled.ErrorMessage name="description" />
                  <Field name="description">
                    {({ field }) => <SForm.Input {...field} type="textarea" />}
                  </Field>
                  <SForm.Label>Contact Phone</SForm.Label>
                  <Styled.ErrorMessage name="contact_phone" />
                  <Field name="contact_phone">
                    {({ field }) => <SForm.Input {...field} type="text" />}
                  </Field>
                  <SForm.Label>Contact Email</SForm.Label>
                  <Styled.ErrorMessage name="contact_email" />
                  <Field name="contact_email">
                    {({ field }) => <SForm.Input {...field} type="email" />}
                  </Field>
                  <SForm.Label>External Link</SForm.Label>
                  <Styled.ErrorMessage name="external_links" />
                  <Field name="external_links">
                    {({ field }) => <SForm.Input {...field} type="text" />}
                  </Field>
                  <SForm.Label>Max # of Volunteers</SForm.Label>
                  <Styled.ErrorMessage name="max_volunteers" />
                  <SForm.Input
                    type="number"
                    name="max_volunteers"
                    value={values.max_volunteers}
                    onBlur={handleBlur}
                    onChange={e => {
                      if (e.target.value && !isNaN(parseInt(e.target.value, 10))) {
                        setFieldValue('max_volunteers', parseInt(e.target.value, 10));
                      } else {
                        setFieldValue('max_volunteers', e.target.value);
                      }
                    }}
                  />
                </SForm.FormGroup>
              </Styled.Form>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={toggle}>
                Cancel
              </Button>
              <Button color="primary" onClick={handleSubmit} disabled={!isValid || isSubmitting}>
                Submit
              </Button>
            </ModalFooter>
          </React.Fragment>
        )}
      />
    </Modal>
  );
};
EventEditModal.propTypes = {
  open: PropTypes.bool,
  toggle: PropTypes.func
};

export default EventEditModal;
