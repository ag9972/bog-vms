import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as Card from '../shared/cardStyles';
import Loading from 'components/Shared/Loading';
import { Icon } from 'components/Shared';
import styled from 'styled-components';
import { Button } from 'reactstrap';
import EventCard from './EventCard';


function EventCardGrid(props) {
    return <Card.cardGrid>
        {!props.loading &&
            props.events.map((event, idx) => (
							<EventCard
                            key = {event._id}
                            event = {event}
                            imgUrl = {"https://image.shutterstock.com/image-photo/beautiful-water-drop-on-dandelion-260nw-789676552.jpg"}
                            onDeleteClicked = {props.onDeleteClicked}
                            />
						))}
    </Card.cardGrid>

}

export default EventCardGrid;