import React, { useState } from 'react';
import styles from './UploadContract.module.css';
import Tabs from './common/Tabs';
<<<<<<< Updated upstream
import CsvUploadTab from './upload/CsvUploadTab';
import EmailBucketTab from './upload/EmailBucketTab';
import FileUploadTab from './upload/FileUploadTab';
import CreateContractTab from './upload/CreateContractTab';

const UploadContract = ({ onNavigate, onRefresh }) => {
    const [activeTab, setActiveTab] = useState('csv');
    const [contractData, setContractData] = useState({});

    const handleDataChange = (newData) => {
        setContractData(newData);
    };

    const tabs = [
        {
            id: 'csv',
            label: 'CSV Upload',
            icon: '📊',
            content: <CsvUploadTab onDataChange={handleDataChange} />
        },
        {
            id: 'email',
            label: 'Email Bucket',
            icon: '📧',
            content: <EmailBucketTab onDataChange={handleDataChange} />
        },
        {
            id: 'file',
            label: 'File Upload',
            icon: '📄',
            content: <FileUploadTab onDataChange={handleDataChange} />
        },
        {
            id: 'create',
            label: 'Create Contract',
            icon: '✍️',
            content: <CreateContractTab 
                onDataChange={handleDataChange} 
                onNavigate={onNavigate} 
                onRefresh={onRefresh}
            />
=======
import SelfServicePortal from './SelfServicePortal';

const UploadContract = ({ initialTab = 'self-service', user, resetToken = 0 }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [portalKey, setPortalKey] = useState(0);

    React.useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    React.useEffect(() => {
        setActiveTab('self-service');
        setPortalKey((prev) => prev + 1);
    }, [resetToken]);

    const tabs = [
        {
            id: 'self-service',
            label: 'New Request',
            icon: '⚡',
            content: (
                <SelfServicePortal
                    key={portalKey}
                    user={user}
                    onSuccess={() => {
                        setActiveTab('self-service');
                        setPortalKey((prev) => prev + 1);
                    }}
                />
            )
>>>>>>> Stashed changes
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.headerSection}>
<<<<<<< Updated upstream
                <h2 className={styles.pageTitle}>Contract Initialization</h2>
                <p className={styles.pageSub}>Select your preferred method to bring new contracts into the CLM system.</p>
=======
                <h2 className={styles.pageTitle}>Create Request</h2>
                <p className={styles.pageSub}>Submit a new contract request or manage your contract repository.</p>
>>>>>>> Stashed changes
            </div>

            <div className={styles.tabsWrapper}>
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(id) => {
                        setActiveTab(id);
                    }}
                />
            </div>
        </div>
    );
};

export default UploadContract;
