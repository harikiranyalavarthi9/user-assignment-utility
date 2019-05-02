const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const qTest_config = {
    headers: {'Authorization': "bearer " + process.argv[3]}
};

function getProjectData() {
    return axios.get(process.argv[5] + '/api/v3/projects', qTest_config);
}

function getUserData() {
    return axios.get(process.argv[5] + `/api/v3/users/search?includeInactiveUsers=false&pagination=false&pageSize=999`, qTest_config);
}

function getUserProfiles() {
    return axios.get(process.argv[5] + `/api/v3/user-profiles`, qTest_config);
}

axios.all([getProjectData(), getUserData(), getUserProfiles()])
    .then(axios.spread(function (project, user, profiles) {
        const project_data = project.data;
        const user_data = user.data;
        const user_profiles = profiles.data.user_profiles;
        var projects = [];
        fs.createReadStream('./projects.csv')
            .pipe(csv())
            .on('data', async (data) => {
                projects.push(data.project_name)
            })
            .on('end', () => {
                fs.createReadStream('./user_list.csv')
                    .pipe(csv())
                    .on('data', async (data) => {
                        let user_profile_filter = user_profiles.filter((value) => value.name == data.profile_name);
                        let project_filter = project_data.filter((value) => projects.includes(value.name));
                        let checkUser = user_data.filter((value) => value.username == data.email);
                        if (checkUser.length === 0) {
                            try {
                                let body = {
                                    username: data.email,
                                    email: data.email,
                                    password: data.password ? data.password : `admin123`,
                                    first_name: data.first_name ? data.first_name : `Verizon`,
                                    last_name: data.last_name ? data.last_name : `User`
                                };
                                let response = await axios.post(process.argv[5] + '/api/v3/users/', body, qTest_config)
                                if (response.status === 201) {
                                    console.log(`Created User: ` + response.data.username);
                                    let new_user = await axios.get(process.argv[5] + '/api/v3/users/search?username=' + data.email + '&includeInactiveUsers=false&pagination=false&pageSize=999', qTest_config);
                                    let new_user_id = new_user.data[0].id;
                                    for (let i = 0; i < project_filter.length; i++) {
                                        let assign_body = {
                                            project_id: parseInt(project_filter[i].id),
                                            profile: {
                                                id: parseInt(user_profile_filter[0].id),
                                                name: user_profile_filter[0].name,
                                                is_readonly: user_profile_filter[0].is_readonly,
                                                is_admin: user_profile_filter[0].is_admin
                                            }
                                        };
                                        let assign_response = await axios.post(process.argv[5] + '/api/v3/users/' + new_user_id + '/projects', assign_body, qTest_config)
                                        if (assign_response.status === 201) {
                                            console.log(`Assigned User: ${data.email} to Project Id: ${project_filter[i].name} as ${data.profile_name}`);
                                        }
                                    }
                                }
                            } catch (error) {
                                if (error.status === 404) {
                                    console.log(`[ERROR]: The requested resource doesn\'t exist.`);
                                } else if (error.status === 400) {
                                    console.log(`[ERROR]: Bad request, often due to missing a required parameter.`);
                                } else if (error.response.status === 401 || error.response.data.error == 'invalid_token') {
                                    console.log(`[ERROR]: It's an ${error.response.data.error_description}`);
                                } else if (error.response.status === 500) {
                                    console.log(`[ERROR]: Invalid email address: ${data.email}. Please deactivate this user`);
                                } else {
                                    console.log(`[ERROR]: unexpected error`);
                                    console.log(error.response.data.message);
                                }
                            }
                        } else {
                            let existing_user = await axios.get(process.argv[5] + '/api/v3/users/search?username=' + data.email + '&includeInactiveUsers=false&pagination=false&pageSize=999', qTest_config);
                            let existing_user_id = existing_user.data[0].id;
                            try {
                                for (let i = 0; i < project_filter.length; i++) {
                                    let existing_body = {
                                        project_id: parseInt(project_filter[i].id),
                                        profile: {
                                            id: parseInt(user_profile_filter[0].id),
                                            name: user_profile_filter[0].name,
                                            is_readonly: user_profile_filter[0].is_readonly,
                                            is_admin: user_profile_filter[0].is_admin
                                        }
                                    };
                                    let assign1_response = await axios.post(process.argv[5] + '/api/v3/users/' + existing_user_id + '/projects', existing_body, qTest_config)
                                    if (assign1_response.status === 201) {
                                        console.log(`Assigned User: ${data.email} to Project: ${project_filter[i].name} as ${data.profile_name}`);
                                    }
                                }
                            } catch (error) {
                                if (error.status === 404) {
                                    console.log(`[ERROR]: The requested resource doesn\'t exist.`);
                                } else if (error.status === 400) {
                                    console.log(`[ERROR]: Bad request, often due to missing a required parameter.`);
                                } else if (error.errno == 'ECONNREFUSED') {
                                    console.log(`[ERROR]: It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
                                } else if (error.response.status === 401 || error.response.data.error == 'invalid_token') {
                                    console.log(`[ERROR]: It's an ${error.response.data.error_description}`);
                                } else if (error.response.status === 500) {
                                    console.log(`[ERROR]: Invalid email address: ${data.email}. Please deactivate this user`);
                                } else {
                                    console.log(`[ERROR]: unexpected error`);
                                    console.log(error.response.data.message);
                                }
                            }
                        }
                    })
                    .on('end', () => {
                        console.log("Completed reading CSV file!");
                    });
            });
    }))
    .catch(function (error) {
        if (error.status === 404) {
            console.log(`[ERROR]: The requested resource doesn\'t exist.`);
        } else if (error.status === 400) {
            console.log(`[ERROR]: Bad request, often due to missing a required parameter.`);
        } else if (error.errno == 'ECONNREFUSED') {
            console.log(`[ERROR]: It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
        } else if (error.errno == 'ENOTFOUND') {
            console.log(`[ERROR]: It's an invalid qTest URL: ${error.errno} - Connection refused by server.`);
        } else if (error.response.status === 401 || error.response.data.error == 'invalid_token') {
            console.log(`[ERROR]: It's an ${error.response.data.error_description}`);
        } else {
            console.log(`[ERROR]: unexpected error`);
            console.log(error.response.data.message);
        }
    });