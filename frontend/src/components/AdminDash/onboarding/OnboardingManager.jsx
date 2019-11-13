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
    display: flex;
    flex-direction: row; 
    margin-left: 5rem;
    justify-content: stretch;
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
      <Form>
        <Styled.HorizontalContainer style={{ justifyContent: "stretch"}}>
          <FormGroup style={{ border: 'none', flex: "1", margin: "10px" }}>
            <Input type="email" name="email" id="exampleEmail" placeholder="Email" />
          </FormGroup>
          <FormGroup style = {{ flex: "1"}}>
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
