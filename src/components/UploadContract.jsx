import React, { useState } from 'react';
import styles from './UploadContract.module.css';
import Tabs from './common/Tabs';
import CsvUploadTab from './upload/CsvUploadTab';
import EmailBucketTab from './upload/EmailBucketTab';
import FileUploadTab from './upload/FileUploadTab';
import CreateContractTab from './upload/CreateContractTab';
import AllContractsTab from './upload/AllContractsTab';

const UploadContract = ({ initialTab = 'csv', onOpenContract }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [contractData, setContractData] = useState({});

    React.useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

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
        },
        {
            id: 'all',
            label: 'All Contracts',
            icon: '📋',
            content: <AllContractsTab onOpenContract={onOpenContract} />
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.headerSection}>
                <h2 className={styles.pageTitle}>Contracts</h2>
                <p className={styles.pageSub}>Manage your contract lifecycle: repository access and new contract initialization.</p>
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

        </div>
    );
};

export default UploadContract;
