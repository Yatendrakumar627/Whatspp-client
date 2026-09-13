import React, { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

/**
 * A lightweight emoji picker component that uses @emoji-mart/react.
 * This is much lighter than the previous custom implementation as it
 * loads emoji data from a CDN and doesn't hardcode thousands of emojis.
 */
const EmojiPickerPanel = ({ onEmojiClick, theme = 'dark' }) => {
    return (
        <div className="emoji-picker-container" style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}>
            <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                    if (onEmojiClick) {
                        onEmojiClick({ emoji: emoji.native });
                    }
                }}
                theme={theme}
                set="native"
                skinTonePosition="none"
                previewPosition="none"
                navPosition="bottom"
                perLine={8}
                maxFrequentRows={1}
                searchPosition="top"
                dynamicWidth={true}
            />
            <style>{`
        .emoji-picker-container em-emoji-picker {
          --border-radius: 0;
          --shadow: none;
          width: 100% !important;
          height: 350px !important;
          max-height: 40vh !important;
        }
      `}</style>
        </div>
    );
};

export default EmojiPickerPanel;
