import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'teal',
    colors: {
        teal: [
            '#e6fffa',
            '#b2f5ea',
            '#81e6d9',
            '#4fd1c5',
            '#38b2ac',
            '#00a884', // 5 - Primary (Authentic WhatsApp Green)
            '#008f70',
            '#00755c',
            '#005c4b',
            '#004237',
        ],
        dark: [
            '#d1d7db', // 0 - Text Primary
            '#8696a0', // 1 - Text Secondary
            '#3b4a54', // 2
            '#2a3942', // 3 - Input BG / Hover
            '#202c33', // 4 - Sidebar BG / Message Header
            '#111b21', // 5 - Main BG / Chat List
            '#0b141a', // 6 - Chat BG
            '#080c0f', // 7
            '#050709', // 8
            '#020304', // 9
        ]
    },
    shadows: {
        xs: '0 1px 2px rgba(11, 20, 26, 0.1)',
        sm: '0 1px 3px rgba(11, 20, 26, 0.15)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    },
    fontFamily: 'Segoe UI, "Helvetica Neue", Helvetica, Arial, sans-serif', // Authentic Windows/Web font stack
    headings: {
        fontFamily: 'Segoe UI, "Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 600,
    },
    radius: {
        xs: rem(4),
        sm: rem(8),
        md: rem(12),
        lg: rem(16),
        xl: rem(24),
    },
    spacing: {
        xs: rem(8),
        sm: rem(12),
        md: rem(16),
        lg: rem(24),
        xl: rem(32),
    },
    components: {
        Button: {
            defaultProps: {
                radius: 'xl',
                size: 'sm',
            },
            styles: {
                root: {
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:active': { transform: 'scale(0.98)' },
                }
            }
        },
        Paper: {
            defaultProps: {
                radius: 'md',
                shadow: 'sm',
            },
            styles: (theme) => ({
                root: {
                    backgroundColor: 'var(--wa-sidebar-bg)',
                    color: 'var(--wa-text-primary)',
                    transition: 'background-color 0.2s ease',
                    border: 'none', // Cleaner look
                }
            })
        },
        ActionIcon: {
            defaultProps: {
                variant: 'subtle',
                radius: 'xl',
            },
            styles: {
                root: {
                    color: 'var(--wa-text-secondary)',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(134, 150, 160, 0.1)', // Subtle hover
                        color: 'var(--wa-text-primary)',
                    },
                    '&:active': {
                        transform: 'scale(0.95)',
                    }
                }
            }
        },
        Modal: {
            styles: {
                content: {
                    backgroundColor: 'var(--wa-popup-bg)',
                    color: 'var(--wa-text-primary)',
                    border: '1px solid var(--wa-border-subtle)',
                },
                header: {
                    backgroundColor: 'var(--wa-popup-bg)',
                    color: 'var(--wa-text-primary)',
                },
                title: {
                    fontWeight: 600,
                }
            }
        },
        Menu: {
            styles: {
                dropdown: {
                    backgroundColor: 'var(--wa-popup-bg)',
                    borderColor: 'var(--wa-border-subtle)',
                    padding: '8px 0',
                    boxShadow: '0 2px 5px 0 rgba(11,20,26,.26), 0 2px 10px 0 rgba(11,20,26,.16)',
                },
                item: {
                    color: 'var(--wa-text-primary)',
                    fontSize: '14.5px',
                    padding: '8px 24px',
                    '&:hover': {
                        backgroundColor: 'var(--wa-hover-bg)',
                    }
                },
                divider: {
                    borderColor: 'var(--wa-border-subtle)',
                }
            }
        },
        TextInput: {
            styles: {
                input: {
                    backgroundColor: 'var(--wa-input-bg)',
                    borderColor: 'transparent',
                    color: 'var(--wa-text-primary)',
                    '&:focus': {
                        borderColor: 'transparent', // WA doesn't have a border on focus mostly
                    },
                    '&::placeholder': {
                        color: 'var(--wa-text-secondary)',
                    }
                }
            }
        }
    },
});

export const resolver = (theme) => ({
    variables: {
        '--wa-green': '#00a884',
        '--wa-green-accent': '#25d366',

        // Light Mode (Refined)
        '--wa-bg-light': '#d1d7db', // The outer background
        '--wa-sidebar-bg-light': '#ffffff',
        '--wa-header-bg-light': '#f0f2f5',
        '--wa-chat-bg-light': '#efeae2',
        '--wa-active-bg-light': '#f0f2f5',
        '--wa-hover-bg-light': '#f5f6f6',
        '--wa-input-bg-light': '#ffffff',
        '--wa-border-light': '#e9edef',
        '--wa-border-subtle-light': 'rgba(11, 20, 26, 0.08)',
        '--wa-text-primary-light': '#111b21',
        '--wa-text-secondary-light': '#54656f',
        '--wa-message-sent-light': '#d9fdd3',
        '--wa-message-received-light': '#ffffff',
        '--wa-popup-bg-light': '#ffffff',

        // Dark Mode (Premium)
        '--wa-bg-dark': '#0b141a', // The outer background (or deep dark) - usually #111b21 is main
        '--wa-sidebar-bg-dark': '#111b21',
        '--wa-header-bg-dark': '#202c33',
        '--wa-chat-bg-dark': '#0b141a', // Chat area darker
        '--wa-active-bg-dark': '#2a3942',
        '--wa-hover-bg-dark': '#202c33',
        '--wa-input-bg-dark': '#2a3942',
        '--wa-border-dark': '#222d34',
        '--wa-border-subtle-dark': 'rgba(134,150,160,0.15)',
        '--wa-text-primary-dark': '#e9edef',
        '--wa-text-secondary-dark': '#8696a0',
        '--wa-message-sent-dark': '#005c4b',
        '--wa-message-received-dark': '#202c33',
        '--wa-popup-bg-dark': '#233138',

        // Dynamic Mappings (Defaulting to Dark for that "Premium" feel requested, or standard)
        // We will stick to the system preference or defaulting logic if we had a toggle. 
        // For now, let's map these to the CSS variables used in components.
    },
    light: {
        '--wa-bg': 'var(--wa-bg-light)',
        '--wa-sidebar-bg': 'var(--wa-sidebar-bg-light)',
        '--wa-header-bg': 'var(--wa-header-bg-light)',
        '--wa-chat-bg': 'var(--wa-chat-bg-light)',
        '--wa-active-bg': 'var(--wa-active-bg-light)',
        '--wa-hover-bg': 'var(--wa-hover-bg-light)',
        '--wa-input-bg': 'var(--wa-input-bg-light)',
        '--wa-border': 'var(--wa-border-light)',
        '--wa-border-subtle': 'var(--wa-border-subtle-light)',
        '--wa-text-primary': 'var(--wa-text-primary-light)',
        '--wa-text-secondary': 'var(--wa-text-secondary-light)',
        '--wa-message-sent': 'var(--wa-message-sent-light)',
        '--wa-message-received': 'var(--wa-message-received-light)',
        '--wa-popup-bg': 'var(--wa-popup-bg-light)',
        '--wa-blur': 'blur(10px)', // Less aggressive blur for cleaner look
    },
    dark: {
        '--wa-bg': 'var(--wa-bg-dark)',
        '--wa-sidebar-bg': 'var(--wa-sidebar-bg-dark)',
        '--wa-header-bg': 'var(--wa-header-bg-dark)',
        '--wa-chat-bg': 'var(--wa-chat-bg-dark)',
        '--wa-active-bg': 'var(--wa-active-bg-dark)',
        '--wa-hover-bg': 'var(--wa-hover-bg-dark)',
        '--wa-input-bg': 'var(--wa-input-bg-dark)',
        '--wa-border': 'var(--wa-border-dark)',
        '--wa-border-subtle': 'var(--wa-border-subtle-dark)',
        '--wa-text-primary': 'var(--wa-text-primary-dark)',
        '--wa-text-secondary': 'var(--wa-text-secondary-dark)',
        '--wa-message-sent': 'var(--wa-message-sent-dark)',
        '--wa-message-received': 'var(--wa-message-received-dark)',
        '--wa-popup-bg': 'var(--wa-popup-bg-dark)',
        '--wa-blur': 'blur(10px)',
    },
});
