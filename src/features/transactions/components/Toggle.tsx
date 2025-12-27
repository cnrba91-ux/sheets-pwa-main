import styles from './Toggle.module.css';

interface Props {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: Props) {
    return (
        <div className={styles.container} onClick={() => onChange(!checked)}>
            <span className={styles.label}>{label}</span>
            <div className={`${styles.switch} ${checked ? styles.checked : ''}`}>
                <div className={styles.thumb} />
            </div>
        </div>
    );
}
