import { useState, type KeyboardEvent } from 'react';
import styles from './TagInput.module.css';

interface Props {
    value: string;
    onChange: (value: string) => void;
    suggestions?: string[];
}

export function TagInput({ value, onChange, suggestions = [] }: Props) {
    const tags = value ? value.split(',').map(t => t.trim()).filter(t => t) : [];
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = suggestions
        .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()))
        .filter(s => !tags.includes(s));

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                const newValue = [...tags, newTag].join(', ');
                onChange(newValue);
            }
            setInputValue('');
            setShowSuggestions(false);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            const newTags = [...tags];
            newTags.pop();
            onChange(newTags.join(', '));
        }
    };

    const addTag = (tag: string) => {
        if (!tags.includes(tag)) {
            const newValue = [...tags, tag].join(', ');
            onChange(newValue);
        }
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTag = (indexToRemove: number) => {
        const newTags = tags.filter((_, i) => i !== indexToRemove);
        onChange(newTags.join(', '));
    };

    return (
        <div className={styles.container}>
            <div className={styles.pillList}>
                {tags.map((tag, i) => (
                    <span key={i} className={styles.pill} style={{ backgroundColor: getTagColor(tag) }}>
                        {tag}
                        <button className={styles.removeBtn} onClick={() => removeTag(i)}>&times;</button>
                    </span>
                ))}
            </div>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={styles.input}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className={styles.dropdown}>
                        {filteredSuggestions.map((s, i) => (
                            <div
                                key={i}
                                className={styles.suggestion}
                                onClick={() => addTag(s)}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getTagColor(tag: string): string {
    const colors = [
        '#e0f2fe', // blue
        '#dcfce7', // green
        '#fef9c3', // yellow
        '#ffedd5', // orange
        '#f3e8ff', // purple
        '#fce7f3', // pink
        '#ccfbf1', // teal
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}
