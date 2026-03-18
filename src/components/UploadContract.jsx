import React, { useState } from 'react';
import styles from './UploadContract.module.css';
import Tabs from './common/Tabs';
import CsvUploadTab from './upload/CsvUploadTab';
import EmailBucketTab from './upload/EmailBucketTab';
import FileUploadTab from './upload/FileUploadTab';
import CreateContractTab from './upload/CreateContractTab';
import AiVerificationPanel from './upload/AiVerificationPanel';

const UploadContract = () => {
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
            content: <CreateContractTab onDataChange={handleDataChange} />
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.headerSection}>
                <h2 className={styles.pageTitle}>Contract Initialization</h2>
                <p className={styles.pageSub}>Select your preferred method to bring new contracts into the CLM system.</p>
            </div>

            <div className={styles.tabsWrapper}>
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(id) => {
                        setActiveTab(id);
                        setContractData({}); // Reset verification state when switching tabs
                    }}
                />
            </div>

            <AiVerificationPanel data={contractData} />
        </div>
    );
};

export default UploadContract;
