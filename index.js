/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
let admin = require('firebase-admin');
let fetch = require('node-fetch');
admin.initializeApp();

//grabs a list of the emails
async function getEmails() {

  let db = admin.firestore();
  let emails = {};
  let refs = db.collection('BSIUsers');
  let allUsers = await refs.get()
  allUsers.forEach(doc => {
    let currData = doc.data()
    if (currData.hasOwnProperty('email') && !emails.hasOwnProperty(currData.email)) {
      if(currData.hasOwnProperty('role')){
        emails[currData.email] = currData.role
      }
      //default is reader
      else{
        emails[currData.email] = 'reader'
      }
    }
  });
  return emails
}

//processes the API call
async function processCall(req,res,role, emails){
  let url = req.url;
  if(url == "/addUser"){
    if(role == "admin"){
      
      if(Object.keys(emails).includes(req.body.email) == false){
        let db = admin.firestore();
        db.collection('BSIUsers').add({
          email:req.body.email,
          name:req.body.name,
          role:req.body.role
        })
        res.statusCode = 200;
        res.end(JSON.stringify({'response':'User added!'}));
        
      }
      else{
        res.statusCode = 500;
        res.end(JSON.stringify({'response':'User already exists!'}));
      }
      
      
      
    }
    else{
      res.statusCode = 500;
      res.end(JSON.stringify({'ERROR':'user does not have proper permissions!'}));
    }
    
  }
  else if(url == "/getUserRole"){
    res.statusCode = 200;
    res.end(JSON.stringify({'role':role}))
  }

  else{
    res.statusCode = 400;
    res.end(JSON.stringify({"ERROR":url + ' does not exist'}));
  }
}

exports.authenticationTesting = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'GET' || req.method === 'POST') {
        let token = ''
        if (req.method === 'GET') {
            token = req.headers.authorization.substring(6)
        }
        else {
            token = req.body.headers.authorization.substring(6)
        }
        admin.auth().verifyIdToken(token)
            .then(function (decodedToken) {
                getEmails()
                    .then(function (emails) {
                        if (emails.hasOwnProperty(decodedToken.email)) {
                            processCall(req,res,emails[decodedToken.email],emails)
                        }
                        else {
                            res.end(JSON.stringify({ 'role': 'Sorry you do not have access to this!' }))
                        }
                    }).catch(function (error) {
                        //console.log(error)
                        res.end(JSON.stringify({ 'ERROR': error }))
                    })

            }).catch(function (error) {
                // Handle error
                res.end(JSON.stringify({ 'ERROR': error }))
            });

    }

    else {

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(req.method);

    }
    
};
