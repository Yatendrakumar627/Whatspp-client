import React from 'react';
import { Dialog, Group, Text, Button, Avatar, Stack } from '@mantine/core';
import { useCall } from '../context/CallContext';

const IncomingCallNotification = () => {
    const { call, answerCall, callAccepted, declineCall } = useCall();

    if (!call.isReceivingCall || callAccepted) return null;

    return (
        <Dialog
            opened={call.isReceivingCall && !callAccepted}
            withCloseButton={false}
            position={{ bottom: 20, right: 20 }}
            shadow="xl"
            radius="md"
            size="lg"
        >
            <Stack spacing="xs" align="center">
                <Text size="lg" weight={700}>Incoming Call</Text>
                <Avatar size="lg" radius="xl" color="blue">{call.name?.[0]}</Avatar>
                <Text size="md">{call.name} is calling...</Text>

                <Group position="center" spacing="md" mt="md">
                    <Button color="green" onClick={answerCall}>
                        Answer
                    </Button>
                    <Button color="red" variant="outline" onClick={declineCall}>
                        Decline
                    </Button>
                </Group>
            </Stack>
        </Dialog>
    );
};

export default IncomingCallNotification;
