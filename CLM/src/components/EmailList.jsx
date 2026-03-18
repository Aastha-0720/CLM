import React, { useState } from 'react';
import styles from './EmailList.module.css';

const sampleEmails = [
    {
        id: 1,
        sender: 'John Miller',
        email: 'john.miller@techsolutions.com',
        subject: 'Service Agreement for Cloud Migration',
        date: '10:45 AM',
        body: 'Hi team, please find attached the service agreement for our upcoming cloud migration project. We need this reviewed by next Friday.',
        attachments: [{ name: 'Service_Agreement_v2.pdf', size: '1.2 MB' }],
        unread: true,
        hasAttachment: true,
        initials: 'JM',
        color: '#3B82F6'
    },
    {
        id: 2,
        sender: 'Sarah Connor',
        email: 's.connor@cyberdyne.io',
        subject: 'Product License Update - Q2 2026',
        date: 'Yesterday',
        body: 'Greetings, the license for our core systems is up for renewal. I have attached the updated terms for your approval.',
        attachments: [{ name: 'Cyberdyne_License_Terms.docx', size: '850 KB' }],
        unread: false,
        hasAttachment: true,
        initials: 'SC',
        color: '#10B981'
    },
    {
        id: 3,
        sender: 'Michael Scott',
        email: 'm.scott@dundermifflin.com',
        subject: 'Paper Supply Contract - Scranton Branch',
        date: 'Mar 14',
        body: 'I am sending over the new supply contract. It is a big one! Needs legal eyes ASAP.',
        attachments: [{ name: 'Paper_Supply_Contract.pdf', size: '2.1 MB' }],
        unread: true,
        hasAttachment: true,
        initials: 'MS',
        color: '#F59E0B'
    },
    {
        id: 4,
        sender: 'Finance Dept',
        email: 'billing@enterprise.com',
        subject: 'Inquiry regarding AMC payment terms',
        date: 'Mar 13',
        body: 'We are reviewing the AMC terms for the next fiscal year. Can you clarify the payment schedule?',
        attachments: [],
        unread: false,
        hasAttachment: false,
        initials: 'FD',
        color: '#6366F1'
    },
    {
        id: 5,
        sender: 'Legal Team',
        email: 'contracts@legalcorp.com',
        subject: 'Redlined NDA for Project X',
        date: 'Mar 12',
        body: 'Please see the attached NDA with our suggested redlines. Let us know if these are acceptable.',
        attachments: [{ name: 'NDA_ProjectX_Redlined.pdf', size: '450 KB' }],
        unread: false,
        hasAttachment: true,
        initials: 'LT',
        color: '#8B5CF6'
    },
    {
        id: 6,
        sender: 'Procurement',
        email: 'procurement@global.com',
        subject: 'New Vendor Onboarding - ABC Services',
        date: 'Mar 11',
        body: 'Attached are the onboarding documents for ABC Services. Please review and initiate the workflow.',
        attachments: [{ name: 'Vendor_Onboarding_DOCS.zip', size: '4.5 MB' }],
        unread: true,
        hasAttachment: true,
        initials: 'PR',
        color: '#EC4899'
    },
];

const EmailList = ({ onSelectEmail, selectedEmailId }) => {
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEmails = sampleEmails.filter((email) => {
        const matchesFilter =
            filter === 'All' ||
            (filter === 'Unread' && email.unread) ||
            (filter === 'With Attachments' && email.hasAttachment);

        const matchesSearch =
            email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.subject.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <h2 className={styles.title}>Emails</h2>
                    <span className={styles.count}>{filteredEmails.length}</span>
                </div>
                <div className={styles.filters}>
                    {['All', 'Unread', 'Attachments'].map((f) => (
                        <button
                            key={f}
                            className={`${styles.filterBtn} ${filter === (f === 'Attachments' ? 'With Attachments' : f) ? styles.active : ''}`}
                            onClick={() => setFilter(f === 'Attachments' ? 'With Attachments' : f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.list}>
                {filteredEmails.map((email) => (
                    <div
                        key={email.id}
                        className={`${styles.emailCard} ${selectedEmailId === email.id ? styles.selected : ''} ${email.unread ? styles.unread : ''}`}
                        onClick={() => onSelectEmail(email)}
                    >
                        <div className={styles.cardSidebar}>
                            <div
                                className={styles.avatar}
                                style={{ backgroundColor: `${email.color}20`, color: email.color }}
                            >
                                {email.initials}
                            </div>
                            {email.unread && <div className={styles.unreadStatus}></div>}
                        </div>

                        <div className={styles.cardContent}>
                            <div className={styles.emailHeader}>
                                <span className={styles.sender}>{email.sender}</span>
                                <span className={styles.date}>{email.date}</span>
                            </div>
                            <div className={styles.subjectRow}>
                                <h3 className={styles.subject}>{email.subject}</h3>
                                {email.hasAttachment && (
                                    <div className={styles.attachmentBadge}>
                                        <span className={styles.attIcon}>📎</span>
                                    </div>
                                )}
                            </div>
                            <p className={styles.snippet}>{email.body}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmailList;
