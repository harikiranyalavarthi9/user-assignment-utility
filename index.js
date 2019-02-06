const fs = require('fs'); 
const csv = require('csv-parser');
const axios = require('axios');

const token = '88fc8cfd-8ff0-465b-acb2-851017fa4798'

const config = {
    headers: {'Authorization': "bearer " + token}
};

fs.createReadStream('./data.csv')
    .pipe(csv())
    .on('data', async (data) => {
        let body = {
            project_id: parseInt(data.project_id),
            profile: { 
                id: parseInt(data.profile_id), 
                name: data.profile_name,
                is_readonly: data.profile_readonly == 'TRUE',
                is_admin: data.profile_admin == 'TRUE'
            }
        }
        try {
            let response = await axios.post('http://linux930.qasymphony.support:8080/api/v3/users/'+data.user_id+'/projects', body, config) 
            console.log(response.status);
        } catch(error) {
            if(error.status === 404) {
                console.log("The requested resource doesn\'t exist.");
            } else if(error.status === 401) {
                console.log("Unauthorized");
            } else if(error.status === 400) {
                console.log("Bad request, often due to missing a required parameter.");
            } else {
                console.log(error);
            }
        }
    })
    .on('end', () => {
        console.log("Completed reading CSV file!");
    });