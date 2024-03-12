import {faker} from '@faker-js/faker';
import user from "../fixtures/user.json";

user.email = faker.internet.email();
user.password = faker.internet.password();
user.title = faker.word.noun();
user.content = faker.word.words(8);
user.author = faker.person.fullName();
user.contentUpdated = faker.word.words(7);
user.postId = faker.number.int({max: 100000});

describe('Test API', () => {
    it('Get all posts. Verify HTTP response status code and content type.', () => {

        cy.log('Getting all posts');
        cy.request({
            method: 'GET',
            url: '/posts',
        }).then((postsResponse) => {
            expect(postsResponse.status).to.eq(200);
            expect(postsResponse.headers['content-type']).to.include('application/json');
        });

    });

    it('Get only first 10 posts. Verify HTTP response status code. Verify that only first posts are returned.', () => {
        cy.request({
            method: 'GET',
            url: '/posts?_start=0&_end=10'
        }).then(postsResponse => {
            expect(postsResponse.status).to.eq(200);
            expect(postsResponse.body).to.have.length(10);
        })
    });

    it('Get posts with id = 55 and id = 60. Verify HTTP response status code. Verify id values of returned records.', () => {

        cy.request({
            method: 'GET',
            url: '/posts/55'
        }).then(sortResponse => {
            expect(sortResponse.status).to.eq(200);
            expect(sortResponse.body.id).to.eq(55);
        })

        cy.request({
            method: 'GET',
            url: '/posts/60'
        }).then(sortResponse => {
            expect(sortResponse.status).to.eq(200);
            expect(sortResponse.body.id).to.eq(60);
        })
    });

    it('Create a post. Verify HTTP response status code (401)', () => {

        cy.request({
            method: 'POST',
            url: '/664/posts',
            failOnStatusCode: false
        }).then((postsResponse) => {
            expect(postsResponse.status).to.eq(401);
        })
    });

    it('Create post with access token in header ', () => {
        cy.log('Registration to get all posts');
        cy.request({
            method: 'POST',
            url: '/register',
            body: {
                email: user.email,
                password: user.password
            }
        }).then((response) => {
            expect(response.status).to.eq(201);
        });

        cy.log('Login to get all posts');
        cy.request({
            method: 'POST',
            url: '/login',
            body: {
                email: user.email,
                password: user.password
            }
        }).then((loginResponse) => {
            expect(loginResponse.status).to.eq(200);
            expect(loginResponse.body).to.have.property('accessToken');

            const loginToken = loginResponse.body.accessToken;

            const postData = {
                title: user.title,
                text: user.content
            };

            cy.log('creates post');
            cy.request({
                method: 'POST',
                url: '/664/posts',
                headers: {
                    Authorization: `Bearer ${loginToken}`
                },
                body: postData
            }).then((postsResponse) => {
                expect(postsResponse.status).to.eq(201);
                expect(postsResponse.body.title).to.equal(postData.title);
                expect(postsResponse.body.text).to.equal(postData.text);
            })

        })

    });

    it('Create post entity and verify that the entity is created. Verify HTTP response status code. Use JSON in body.', () => {
        cy.request({
            method: 'POST',
            url: '/posts',
            body: {
                "title": user.title,
                "content": user.content,
                "author": user.author
            }
        }).then(sortResponse => {
            expect(sortResponse.status).to.eq(201);
        })
    });

    it('Update non-existing entity. Verify HTTP response status code (404)', () => {
        cy.request({
            method: 'PUT',
            url: `/posts/${user.postId}`,
            body: {
                "title": user.title,
                "content": user.contentUpdated,
                "author": user.author,
            },
            failOnStatusCode: false
        }).then(putResponse => {
            expect(putResponse.status).to.eq(404);
        })
    });

    it('Create post entity and update the created entity. Verify HTTP response status code and verify that the entity is updated.', () => {
        cy.log('Create a new post');
        cy.request({
            method: 'POST',
            url: '/posts',
            body: {
                "id": user.postId,
                "title": user.title,
                "content": user.content,
                "author": user.author
            }
        }).then(sortResponse => {
            expect(sortResponse.status).to.eq(201);
        })

        cy.log('Update the created post');
        cy.request({
            method: 'PUT',
            url: `/posts/${user.postId}`,
            body: {
                "title": user.title,
                "content": user.contentUpdated,
                "author": user.author,
            }
        }).then(putResponse => {
            expect(putResponse.status).to.eq(200);
            expect(putResponse.body.content).to.eq(user.contentUpdated);
        })
    })

    it('Delete non-existing post entity. Verify HTTP response status code (404)', () => {
        cy.request({
            method: 'DELETE',
            url: `/posts/${user.title}`,
            failOnStatusCode: false
        }).then(deleteResponse => {
            expect(deleteResponse.status).to.eq(404);
        })
    })

    it('Create post entity, update the created entity, and delete the entity. Verify HTTP response status code and verify that the entity is deleted.', () => {

        cy.log('Delete the created and updated post');
        cy.request({
            method: 'DELETE',
            url: `/posts/${user.postId}`,
        }).then(deleteResponse => {
            expect(deleteResponse.status).to.eq(200);
        })

        cy.log('Checking the deleted post with the GET endpoint + id');
        cy.request({
            method: 'GET',
            url: `/posts/${user.postId}`,
            failOnStatusCode: false
        }).then((postsResponse) => {
            expect(postsResponse.status).to.eq(404);
        });
    })

})