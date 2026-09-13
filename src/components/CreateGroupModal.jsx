import React from 'react';
import { Modal, TextInput, MultiSelect, Button, Stack, Group, Avatar, Text } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { notifications } from '@mantine/notifications';

const CreateGroupModal = ({ opened, onClose }) => {
    const { api, fetchChats, setSelectedChat } = useChat();
    const [groupName, setGroupName] = useState('');
    const [participants, setParticipants] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch users (Debounced)
    useEffect(() => {
        if (!opened) return;

        const timer = setTimeout(async () => {
            try {
                // Fetch with search query from our new users endpoint
                const { data } = await api.get(`/users?search=${searchValue}`);
                setUsers(data.map(u => ({ value: u._id, label: u.username, ...u })));
            } catch (e) {
                console.error("Failed users", e);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [opened, searchValue, api]);

    const handleCreate = async () => {
        if (!groupName.trim() || participants.length < 1) return;
        setLoading(true);
        try {
            // Ensure backend supports creating group with these participants
            const { data } = await api.post('/chats/group/create', {
                name: groupName,
                participants
            });
            await fetchChats(); // Refresh list to show new group
            setSelectedChat(data._id);
            onClose();
            // Reset state
            setGroupName('');
            setParticipants([]);
            notifications.show({ title: 'Success', message: 'Group created successfully', color: 'green' });
        } catch (error) {
            notifications.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create group', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Group" centered>
            <Stack>
                <TextInput
                    label="Group Name"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                />
                <MultiSelect
                    label="Add Participants"
                    placeholder="Type to search users..."
                    data={users}
                    value={participants}
                    onChange={setParticipants}
                    searchable
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    nothingFoundMessage={searchValue ? "No users found" : "Type to search"}
                    limit={20}
                    clearable
                    hidePickedOptions
                    maxDropdownHeight={200}
                    renderOption={({ option }) => (
                        <Group gap="sm">
                            <Avatar src={null} size="sm" color="blue">{option.label[0]}</Avatar>
                            <Text size="sm">{option.label}</Text>
                        </Group>
                    )}
                />
                <Button loading={loading} onClick={handleCreate} color="teal" fullWidth mt="md">
                    Create Group
                </Button>
            </Stack>
        </Modal>
    );
};

export default CreateGroupModal;
