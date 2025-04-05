# NorthLark Wren Consular  
Secure Your Digital Frontiers with Biometric Verification & Fraud Protection  

## **Overview**  
NorthLark Wren Consular ensures fortified transactions and authenticated identities by integrating biometric verification and fraud detection. Our platform conducts thorough Sanction, PEP, and Adverse Media checks while delivering detailed compliance reports.  

## **Key Features**  
- **Facial Biometrics Integration** – Advanced facial recognition for secure identity verification.  
- **Real-Time Fraud Assessment** – Detects and flags suspicious activities instantly.  
- **Comprehensive Watchlist Reporting** – Provides in-depth insights on security threats.  
- **Adaptive Fraud Detection** – AI-powered system that continuously evolves against fraud patterns.  
- **Secure Data Handling** – Implements robust encryption for sensitive data protection.  

## **Development**  
### **Tech Stack**  
- **Frontend:** [React]  
- **Backend:** [Node.js]
- **Machine Learning:** [Python]  
- **Database:** [MongoDB]    

### **Installation & Setup**  
1. **Clone the repository:**  
   git clone https://gitlab.kernernorland.com/kn-northlark/wren_consular_dev.git
   cd wren_consular_dev-main

2. **Install dependencies:**  
   npm install

3. **Set up environment variables:**  
   Create .env files and add necessary credentials from Wren folder in SharePoint for both client and server side.
   https://northlark.sharepoint.com/:f:/s/NorthLarkDev/EoBTf6CFHBdHisVFOfnrvTMBKY5iGveHWnwI94bXUy6ujg?e=UOOR8A

4. **Run the project:**  
   npm start

5. **Clone and run wren-python:**
   https://gitlab.kernernorland.com/kn-northlark/wren-python

   create .env file for python and add necessary credentials
   https://northlark.sharepoint.com/:w:/s/NorthLarkDev/EQ87qu_B5A1DsuRq7G17giQBHqVfqpqb19xFCATg4HwSDA?e=mfsbLx

### **Setting Up the MongoDB Database**
1. **Import an Existing Database Using mongodump:** 
 Use the `mongodump` tool to back up the existing database:

- *Create a backup of the wren_revamp database by running the following mongodump command:*  
    mongodump --uri "wern dev DB URL" --out ./wren_revamp

   get the wren dev DB URL from sharepoint 
   https://northlark.sharepoint.com/:w:/s/NorthLarkDev/EY3DKe90Y7FMg6mi-xlTpwcB21gEWIXNabRvTM0A5b6FKQ?e=0Gujj7

- *Restore the backup into the wren_revamp database by running the following mongorestore command:* 
   mongorestore --db wren_revamp "your path"

2. **Create a new database and populate it manually:** 
In MongoDB Compass, click on the Create Database option, choose a name for the new database, and create an initial collection. 

Use the below structure to get an idea for the DB collections.
**wren_revamp**
- accounts
- countries
- document_types   
- documents  
- groups 
- histories 
- messages  
- nationalities 
- notifications
- tasks    
- worldchecks

