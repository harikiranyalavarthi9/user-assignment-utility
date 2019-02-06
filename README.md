# verizon-utility

A sample utility to parse CSV file and assign users to projects using qTest API's and NodeJS.

# Installation & How to Run

Before moving forward, Please generate access token using [qTest API's](https://api.qasymphony.com/#/login/postAccessToken) 

You would need to clone the repository to run the application

```bash
git clone https://github.com/harikiranyalavarthi9/verizon-utility.git
cd verizon-utility
```

You can run the application on Windows, MacOS, Linux either using node or using executable files.

######To run using node

Install node modules:

```bash
npm install
```
Run the utility using below command

```bash
node utility -token <token_generated_from_qtest> -url <qTest_URL>
```

######To run using executable files:

For Windows: 

```bash
./utility-win -token <token_generated_from_qtest> -url <qTest_URL>
```

For MacOS:

```bash
./utility-macos -token <token_generated_from_qtest> -url <qTest_URL>
```
For Linux:

```bash
./utility-linux -token <token_generated_from_qtest> -url <qTest_URL>
```
