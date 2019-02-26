const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const user_profiles = [
    {
        "id": 228866,
        "name": "Business Analyst",
        "is_readonly": false,
        "is_admin": false
    },
    {
        "id": 228867,
        "name": "Developer",
        "is_readonly": false,
        "is_admin": false
    },
    {
        "id": 228871,
        "name": "New User Profile",
        "is_readonly": false,
        "is_admin": false
    },
    {
        "id": 228868,
        "name": "Project Admin",
        "is_readonly": true,
        "is_admin": true
    },
    {
        "id": 228869,
        "name": "Project Manager",
        "is_readonly": false,
        "is_admin": false
    },
    {
        "id": 228870,
        "name": "Quality Assurance",
        "is_readonly": false,
        "is_admin": false
    },
    {
        "id": 228873,
        "name": "Sessions Project Admin",
        "is_readonly": true,
        "is_admin": true
    },
    {
        "id": 228872,
        "name": "Sessions User",
        "is_readonly": true,
        "is_admin": false
    },
    {
        "id": 233904,
        "name": "Untitled",
        "is_readonly": false,
        "is_admin": false
    }
]

const qTest_config = {
    headers: {'Authorization': "bearer " + process.argv[3]}
};
function getProjectData() {
    return axios.get(process.argv[5]+'/api/v3/projects', qTest_config);
  }
  
function getUserData() {
    return axios.get(process.argv[5]+`/api/v3/users/search?includeInactiveUsers=false&pagination=false&pageSize=999`, qTest_config);
}
  
axios.all([getProjectData(), getUserData()])
.then(axios.spread(function (project, user) {
    const project_data = project.data;
    const user_data = user.data;
    fs.createReadStream('./new_sample_data.csv')
    .pipe(csv())
    .on('data', async (data) => {
        let user_profile_filter = user_profiles.filter((value) => value.name == data.profile_name);
        let project_filter = project_data.filter((value) => value.name == data.project_name);
        let checkUser = user_data.filter((value) => value.username == data.email);
        if(checkUser.length === 0) {
            try {
                let body = {
                    username: data.email,
                    email: data.email,
                    password: `admin123`,
                    first_name: `Verizon`,
                    last_name: `User`
                }
                let response = await axios.post(process.argv[5]+'/api/v3/users/', body, qTest_config) 
                if(response.status === 201) {
                    console.log(`Created User: `+response.data.username);
                    let new_user = await axios.get(process.argv[5]+'/api/v3/users/search?username='+data.email+'&includeInactiveUsers=false&pagination=false&pageSize=999', qTest_config);
                    let new_user_id = new_user.data[0].id;

                    let assign_body = {
                        project_id: parseInt(project_filter[0].id),
                        profile: { 
                            id: parseInt(user_profile_filter[0].id), 
                            name: user_profile_filter[0].profile_name,
                            is_readonly: user_profile_filter[0].is_readonly,
                            is_admin: user_profile_filter[0].is_admin
                        }
                    }

                    let assign_response = await axios.post(process.argv[5]+'/api/v3/users/'+new_user_id+'/projects', assign_body, qTest_config) 
                    if(assign_response.status === 201) {
                        console.log(`Assigned User: ${data.email} to Project Id: ${data.project_name} as ${data.profile_name}`);
                    }
                }
            } catch(error) {
                if(error.status === 404) {
                    console.log(`[ERROR]: The requested resource doesn\'t exist.`);
                } else if(error.status === 400) {
                    console.log(`[ERROR]: Bad request, often due to missing a required parameter.`);
                } else if(error.response.status === 401 || error.response.data.error == 'invalid_token') {
                    console.log(`[ERROR]: It's an ${error.response.data.error_description}`);
                } else if(error.response.status === 500) {
                    console.log(`[ERROR]: Invalid email address: ${data.email}. Please deactivate this user`);
                } else {
                    console.log(error);
                }
            }
        } 
        else {
            let existing_user = await axios.get(process.argv[5]+'/api/v3/users/search?username='+data.email+'&includeInactiveUsers=false&pagination=false&pageSize=999', qTest_config);
            let existing_user_id = existing_user.data[0].id;
            try {
                let existing_body = {
                    project_id: parseInt(project_filter[0].id),
                    profile: { 
                        id: parseInt(user_profile_filter[0].id), 
                        name: user_profile_filter[0].profile_name,
                        is_readonly: user_profile_filter[0].is_readonly,
                        is_admin: user_profile_filter[0].is_admin
                    }
                }

                let assign1_response = await axios.post(process.argv[5]+'/api/v3/users/'+existing_user_id+'/projects', existing_body, qTest_config) 
                if(assign1_response.status === 201) {
                    console.log(`Assigned User: ${data.email} to Project: ${data.project_name} as ${data.profile_name}`);
                }
            } catch(error) {
                if(error.status === 404) {
                    console.log(`[ERROR]: The requested resource doesn\'t exist.`);
                } else if(error.status === 400) {
                    console.log(`[ERROR]: Bad request, often due to missing a required parameter.`);
                } else if(error.errno == 'ECONNREFUSED'){
                    console.log(`[ERROR]: It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
                } else if(error.response.status === 401 || error.response.data.error == 'invalid_token') {
                    console.log(`[ERROR]: It's an ${error.response.data.error_description}`);
                } else if(error.response.status === 500) {
                    console.log(`[ERROR]: Invalid email address: ${data.email}. Please deactivate this user`);
                } else {
                    console.log(error);
                }
            }
        }
    })
    .on('end', () => {
        console.log("Completed reading CSV file!");
    });
}))
.catch(function (error) {
    if(error.status === 404) {
        console.log(`[ERROR]: The requested resource doesn\'t exist.`);
    } else if(error.status === 400) {
        console.log(`[ERROR]: Bad request, often due to missing a required parameter.`);
    } else if(error.errno == 'ECONNREFUSED') {
        console.log(`[ERROR]: It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
    } else if(error.errno == 'ENOTFOUND') {
        console.log(`[ERROR]: It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
    } else if(error.response.status === 401 || error.response.data.error == 'invalid_token') {
        console.log(`[ERROR]: It's an ${error.response.data.error_description}`);
    } else {
        console.log(error);
    }
});