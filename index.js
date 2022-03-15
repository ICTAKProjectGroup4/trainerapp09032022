const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const mailer = require("nodemailer");
const multer = require('multer');
const moment = require('moment') ;
const UserLoginInfo = require('./src/model/TrainerDB');
const TrainerInfo = require('./src/model/TrainerInfo');
const CounterInfo = require('./src/model/CounterDB');
const ScheduleInfo = require('./src/model/ScheduleDB')
//object init
const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, 'src/build')));
app.use(express.static('public'));
app.use('/static', express.static('public'))
app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const jwt = require('jsonwebtoken');
const bcrpt = require('bcrypt');

//photo upload
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public'),
    filename: function (req, file, cb) {   
        // null as first argument means no error
        cb(null, Date.now() + '-' + file.originalname )  
    }
})

app.get('/', function (req, res) {
    res.send("trainer server up");
});
/*app.post('/', function (req, res) {
    res.send(`hi ${req.body.name} trainerpost`);
});*/

//add trainer
app.post('/api/enroll', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
    const newId = await getNextSequence();
    console.log("newId", newId);
    let val = req.body;
    val.id = newId;
    console.log("val", val);

    const trainer = new TrainerInfo(val);
    const newtrainer = await trainer.save();
    console.log('newtrainer', newtrainer);

    updateSequence(newId);

    res.send({ newtrainer });

});

async function getNextSequence() {
    const filter = { type: "user" };
    let doc = await CounterInfo.findOne(filter)
    console.log("doc", doc);
    return doc.seq + 1;
}

function updateSequence(newId) {
    const filter = { type: "user" };
    CounterInfo.updateOne(filter, { seq: newId }, (err, data) => {
        if (err) {
            return err;
        }

        return data;
    })
}

//view trainer
app.get('/api/viewprofile/:email', async (req, res) => {
    const _email = req.params.email;
    const filter = { email: _email };
    let doc1 = await TrainerInfo.findOne(filter)
    res.json(doc1);
});

//routing register
app.post("/api/register", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Access-Control-Allow-Credentials', true)
    try {
        UserLoginInfo.find({ email: req.body.email }, (err, data) => {
            console.log("data", data);
            if (data.length == 0) {

                let user = new UserLoginInfo({
                    email: req.body.email,
                    password: bcrpt.hashSync(req.body.password, 10),
                    utype: "trainer"
                })
                let result = user.save((err, data) => {
                    if (err) {
                        res.status(201).send({ status: 'error happened' })
                    }
                    else {
                        res.send({ status: 'sucesss' })
                    }
                })
            }
            else {
                res.status(201).send({ status: 'email id already exists' })
            }
        })
    }
    catch (error) {
        res.status(201).send({ status: 'error' })
    }
})

//login
//login authentication routing
app.post('/api/userlogin', async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.password == undefined || req.body.utype == undefined) {
            res.status(500).send({ error: "authentication failed" });
        }
        console.log(req.body)
        var userEmail = req.body.email
        var userPass = req.body.password
        var utype = req.body.utype
        //for approve check
        let result = UserLoginInfo.find({ email: userEmail }, (err, data) => {
            if (data.length > 0) {
                try {
                    const passwordValidator = bcrpt.compareSync(userPass, data[0].password)
                    console.log(passwordValidator)
                    if (passwordValidator) {
                        // token generation
                        jwt.sign({ email: data[0].email, id: data[0]._id },
                            'godblessu',
                            { expiresIn: '1d' },
                            (err, token) => {
                                if (err) {
                                    res.status(201).send({ status: 'error in token generation' })
                                }
                                else {
                                    let pwCheckFlag = false;
                                    if (utype == "trainer") {
                                        let approve = TrainerInfo.find({ email: userEmail }, (err, data1) => {
                                            if (data1.length > 0) {
                                                pwCheckFlag = data1[0].approved;
                                                console.log("appr", pwCheckFlag)
                                                if (pwCheckFlag) {
                                                    console.log("authorized", pwCheckFlag)
                                                    res.send({ status: 'login success', token: token })
                                                    return;
                                                }else{
                                                    console.log("unauthorized", pwCheckFlag)
                                                    res.status(201).send({ status: 'unauthorised' })
                                                    return
                                                }
                                            }
                                        })
                                    } else {
                                        res.send({ status: 'login success', token: token })
                                        return;
                                    }
                                }
                            }
                        )
                    }
                    else {
                        res.status(201).send({ status: 'invalid password' })
                    }
                }
                catch (error) {
                    res.json({ status: 'error..failed' })
                }
            }
            else {
                res.status(201).send({ status: 'invalid email id' })
            }
        })


        //end approve check
    }
    catch (error) {
        res.json({ status: 'error..authentication failed' })

    }
})


// Basic Approval Pending Trainers List Fetch Route
app.get('/api/pending', (req, res) => {
    const filter = { approved: false };
    TrainerInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
    
});

// Approval pending trainer indivual details
app.get('/api/pending/:_id', (req, res) => {
    const _id = req.params._id;
    TrainerInfo.findOne({_id: _id})
    .then(function(users){
        res.json(users)
    });
    
});

// Trainer approval
app.post('/api/pending/:_id/approve', (req, res) => {
    const type = req.body.type;
    const id = req.body.id;
    const name=req.body.name;
    const email=req.body.email;
    const _id = req.params._id;
    let from = `ICT Academy <ictakprojectgroup@gmail.com>`
    console.log(id);
    let body ={
        from: from,
        to: `${email}`,
        subject: 'Trainer Approval',
        html: `<p>Dear <b>${name}</b>,<br> </br> <br> </br> We acknowledge the reciept of your Trainer Application. <br> </br> We are happy to inform you that your application has been <b>APPROVED</b>.<br> </br>  <br> </br> Please note the below details:<br> </br> <br><b> ID:${id}<br> </br> Type of Employment:<span style="text-transform:uppercase"> ${type} </span></b><br> </br><br> </br><i> Wishing all the best. </i><br> </br> <br> </br>Thanks and Regards,<br> </br> <b>ICTAK Academy</b></p><br>`,
    }
    
    const transporter =   mailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS
        }
    })
    
    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
    
    transporter.sendMail(body,(err, result) =>{
        if (err) {
            console.log(err);
            return false
        }
        console.log(result);
        console.log("email sent");
    })

    
    const filter = { _id: _id };
    TrainerInfo.findOneAndUpdate(filter, {type:type, approved:'true'}, { new: true })
    .then(function(users){
        res.json(users)
    });
    
});

// Approved Trainer List
app.get('/api/search', (req, res) => {
    const filter = { approved: true };
    TrainerInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
});

//Allocate specific trainer
app.get('/api/search/:id', (req, res) => {
    const id = req.params.id;
    const filter = { id: id };
    TrainerInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
});

//Batch allocation
app.post('/api/schedule/:id', (req, res) => {
    const { id, name, email, course, batch, startDate, endDate, meeting, startTime, endTime } = req.body;
    let j=0;
    // two ranges overlap condition
    ScheduleInfo.find({id: id},{startDate:1,endDate:1,_id:0}).then(existingDate => {
        
        let sDate = (moment(startDate).format('DD/MMM/YYYY'));
        let eDate = (moment(endDate).format('DD/MMM/YYYY'));

        let iSDate = new Date(moment(startDate).format('DD/MMM/YYYY')).getTime();
        let iEDate = new Date (moment(endDate).format('DD/MMM/YYYY')).getTime();

        for(i=0;i<existingDate.length;i++){
            let eSDate = new Date(moment(existingDate[i].startDate).format('DD/MMM/YYYY')).getTime();
            let eEDate = new Date(moment(existingDate[i].endDate).format('DD/MMM/YYYY')).getTime();

            if((eSDate <= iEDate) && (iSDate <= eEDate)){
                j=j+1
            }
        } 
        console.log(j);
        
            if(j>0){
            console.log("overlap");
             res.status(409).send("Overlap");
            // res.status(201).send({ status: 'Overlap' })
            console.log(res.statusCode);
        }
        else{

            const update = {id,name,course, batch, startDate, endDate, meeting, startTime, endTime };
            // console.log(update);
            ScheduleInfo.insertMany(update)
            .then(function(users){
                // res.json(users)
                console.log("status", "success");
                res.status(200).send("Success");
            });
            
            let from = `ICT Academy <ictakprojectgroup@gmail.com>`
    let body ={
        from: from,
        to: `${email}`,
        subject: 'Trainer Allotment',
        html: `<p>Dear <b>${name}</b>,<br> </br> <br> </br> Please find the Allotment Details: <br> </br> <br><b> Course:${course}<br> </br> <br><b> Batch:${batch}<br> </br>  <br><b> Start Date:${sDate}<br> </br> <br><b> End Date:${eDate}<br> </br> </br><br> <br><b> Meeting Link:${meeting}<br> </br>  </br><i>  </br> <br> </br>Thanks and Regards,<br> </br> <b>ICTAK Academy</b></p><br>`,
    }
    
    const transporter =   mailer.createTransport({
        service: 'gmail',
        auth:{
            user: process.env.EMAIL_USER,
            pass : process.env.EMAIL_PASS
        }
    })
    
   
    // verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });
    
    transporter.sendMail(body,(err, result) =>{
        if (err) {
            console.log(err);
            return false
        }
        // console.log(result);
        console.log("email sent");
    })
   
        }
    });
    
    
});

// Schedule List
app.get('/api/schedule', (req, res) => {
    ScheduleInfo.find()
    .then(function(users){
        res.json(users)
    });
});

//Individual trainer list
app.get('/api/schedule/:id', (req, res) => {
    const id = req.params.id;
    console.log(id);
    const filter = { id: id };
    ScheduleInfo.find(filter)
    .then(function(users){
        res.json(users)
    });
});



//edit trainer
app.post('/api/editprofile/:id/', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
    const trainerId = req.params.id;
    const updateTrainer = req.body;
    const filter = { id: trainerId };
    const update = { $set: updateTrainer };

    const upTr = await TrainerInfo.findOneAndUpdate(filter, update, { new: true })
        .then(function (trainer) {
            res.json(trainer);

        })
})

//photoupload
app.post('/api/photo/:id', async (req, res) => {	

    const id = req.params.id;
    try{
        

        let upload = multer({ storage: storage}).single('photo');
       

        upload(req, res, function(err) {
            if (!req.file) {
                return res.send('Please select an image to upload');
            }
            else if (err instanceof multer.MulterError) {
                return res.send(err);
            }
            else if (err) {
                return res.send(err);
            }
            const update = {
				photo: req.file.path
			};
            const photo = req.file.filename;
            // console.log(update);
            console.log(photo);
            console.log(id);
            const filter = { id: id };
            TrainerInfo.findOneAndUpdate(filter, {photo: photo}, { new: true })
            .then(function(users){
            res.json(users)
    });
        });  
    }catch (err) {console.log(err)}
    }); 
//listening to port

//app.listen(process.env.PORT || 5000, () => { console.log(`Listening on port ${process.env.PORT} or 5000`) });
//listening to port

app.get('*', (req,res)=> {
    res.sendFile(path.join(__dirname + '/src/build/index.html'));
})

app.listen(process.env.PORT ||5000, () => { console.log("listening on port 5000") });
