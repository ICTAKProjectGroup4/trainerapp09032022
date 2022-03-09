const mongoose = require('mongoose');
//mongoose.connect('mongodb://localhost:27017/Library');
//mongose and backend connection establishment
//mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority');

mongoose.connect('mongodb+srv://Ictakprojectgroup4:Project123@cluster0.uvz0n.mongodb.net/Ictakproject4?retryWrites=true&w=majority');
//schema definition
const Schema1 = mongoose.Schema;
//creating a model ith the collection
var userinfoSchema = new Schema1({
       
    email: String,
    password: String,
    utype: String
});
var UserLoginInfo = mongoose.model('logins', userinfoSchema);

module.exports= UserLoginInfo;
