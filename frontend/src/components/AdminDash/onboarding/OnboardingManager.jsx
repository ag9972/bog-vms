import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from 'components/Shared';
import { Button, Form, FormGroup, Label, Input, FormText } from 'reactstrap';

import onboarding1 from '../../../images/onboarding_1.svg'
const Styled = {
  Container: styled.div`
    width: 100%;
    height: 100%;
    background: ${props => props.theme.grey9};
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: space-around;
  `,
  HorizontalContainer: styled.div`
    width: 100%;
    display: flex;
    flex-direction: row; 
    margin-left: 5rem;
  `,
  ImgContainer: styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 3rem;
  `,
  TxtContainer: styled.div`
    display: flex;
    align-content: center;
  `,
  Button: styled(Button)`
    border: none;
    background: gray;
  `,
  BackButton: styled(Button)`
    border: none;
  `,
  ButtonContainer: styled.div`
    display: flex;
    justify-content: center;
    align-items: center
    flex-direction: row
  `
};

const Onboarding1 = () => {
  const [loading] = useState(true);

  return (
    <Styled.Container>
      <Styled.HorizontalContainer style={{ }}>
        <Styled.BackButton>
          Back
        </Styled.BackButton>
      </Styled.HorizontalContainer>
      <Styled.TxtContainer style={{ textAlign: 'center', marginTop: "2rem"}}>
        <legend> Hi, let's get your account set up.</legend>
      </Styled.TxtContainer>
      <Styled.ImgContainer>
        <img style={{ width: '900px', height: '87px'}} alt="onboard" src={onboarding1}/>
      </Styled.ImgContainer>
      <Styled.TxtContainer style={{ marginLeft: '5rem', marginTop: "2rem"}}>
        <legend>Account Information</legend>
      </Styled.TxtContainer>
      <Form style={{ width: '100%' }}>
        <Styled.HorizontalContainer style={{ justifyContent: "space-evenly"}}>
          <FormGroup style={{ border: 'none' }}>
            <Input type="email" name="email" id="exampleEmail" placeholder="Email" />
          </FormGroup>
          <FormGroup>
            <Input type="password" name="password" id="examplePassword" placeholder="Password" />
          </FormGroup>
        </Styled.HorizontalContainer>
        <Styled.HorizontalContainer style={{ justifyContent: "space-evenly" }}>
          <FormGroup style={{ border: 'none' }}>
            <Input type="text" name="fname" id="firstName" placeholder="First Name"/>
          </FormGroup>
          <FormGroup style={{ border: 'none' }}>
            <Input type="text" name="lname" id="lastName" placeholder="Last Name"/>
          </FormGroup>
          <FormGroup style={{ border: 'none' }}>
            <Input type="select" name="select" id="roleSelect">
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </Input>
          </FormGroup>
        </Styled.HorizontalContainer>
        <Styled.HorizontalContainer>
          <Styled.Button>
            Next
          </Styled.Button>
        </Styled.HorizontalContainer>
      </Form>
    </Styled.Container>
  );
};

export default Onboarding1;


//
// <Styled.ButtonContainer>
//     <Styled.Button>
//         Login
//     </Styled.Button>
//     <Styled.Button>
//         Forgot Password?
//     </Styled.Button>
// </Styled.ButtonContainer>
// <FormText>
//     Don't have an account? Let's <a href ='/onboarding-create'>set it up</a>.
// </FormText>
// </Form>
// </Styled.ContainerTest>
// <Styled.ContainerTest>
//     <Styled.ImgContainer>
//         <img style={{ width: '720px', height: '783px' }}alt="onboardingImage" src={image} />
//     </Styled.ImgContainer>
// </Styled.ContainerTest>