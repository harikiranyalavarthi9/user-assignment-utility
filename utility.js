const fs = require('fs'); 
const csv = require('csv-parser');
const axios = require('axios');

if(process.argv.length != 6) {
    console.log(`Please provide Token and URL`);
}
else {
    const config = {
        headers: {'Authorization': "bearer " + process.argv[3]}
    };
    fs.createReadStream('./sample_data.csv')
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
            let response = await axios.post(process.argv[5]+'/api/v3/users/'+data.user_id+'/projects', body, config) 
            if(response.status === 201) {
                console.log(`Assigned User: ${data.user_id} to Project Id: ${data.project_id} as ${data.profile_name}`);
            }
        } catch(error) {
            if(error.status === 404) {
                console.log("The requested resource doesn\'t exist.");
            } else if(error.status === 401) {
                console.log("Unauthorized");
            } else if(error.status === 400) {
                console.log("Bad request, often due to missing a required parameter.");
            } else if(error.errno == 'ECONNREFUSED'){
                console.log(`It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
            } else if(error.response.data.error == 'invalid_token' || error.response.status === 401) {
                console.log(`It's an ${error.response.data.error_description}`);
            } else {
                console.log(error);
            }
        }
    })
    .on('end', () => {
        console.log("Completed reading CSV file!");
    });
}

