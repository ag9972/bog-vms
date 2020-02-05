import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Route, Redirect, Switch } from 'react-router-dom';
import OnboardingManager from './onboarding/OnboardingManager';
import AdminOnboarding1 from './onboarding/AdminOnboarding1';
import AdminOnboarding2 from './onboarding/AdminOnboarding2';
import AdminOnboarding3 from './onboarding/AdminOnboarding3';
import AdminOnboarding4 from './onboarding/AdminOnboarding4';
import VolunteerOnboarding5 from './onboarding/VolunteerOnboarding1';

const Styled = {
  Container: styled.div`
    background-color: white;
    width: 100%;
    height: 100%;
  `
};

const Splash = () => {
  return (
    <Styled.Container>
      <Switch>
        <Route exact path="/" component={OnboardingManager} />
        <Route exact path="/onboarding1" component={AdminOnboarding1} />
        <Route exact path="/onboarding2" component={AdminOnboarding2} />
        <Route exact path="/onboarding3" component={AdminOnboarding3} />
        <Route exact path="/onboarding4" component={AdminOnboarding4} />
        <Route exact path="/onboarding5" component={VolunteerOnboarding5} />
        <Route render={() => <Redirect to="/" />} />
      </Switch>
    </Styled.Container>
  );
};

export default Splash;
