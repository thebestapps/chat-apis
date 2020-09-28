var express =   require("express");
const user = require('../../models/user.model');
const common = require('../../config/functions');
const jwt = require('jsonwebtoken');
const chat = require('../../models/chat.model');
const pin = require('../../models/map_lat_long.model');
const user_circle_model = require('../../models/usercircles.model');
const chat_group = require('../../models/chat_group.model');
const notification_history = require('../../models/push_history.model');
const send_notification = require('../../config/notification');
const { create } = require("../../models/user.model");
const usercirclesModel = require("../../models/usercircles.model");
const { Template } = require("ejs");
const map_lat_longModel = require("../../models/map_lat_long.model");

exports.signup = function(req, res){
    //if (req.body.email && req.body.username && req.body.password && req.file.path && req.body.device_token && req.body.device_os) {
    if (req.body.email && req.body.username && req.body.password && req.body.device_token && req.body.device_os) {
        var newuser = new user();
        newuser.username = req.body.username;
        newuser.password = newuser.generateHash(req.body.password);
        newuser.email = req.body.email;
        newuser.country = req.body.country;
        newuser.profile_pick = req.file?req.file.filename:null;
        // newuser.profile_pick = req.profile_pick;
        newuser.device_token = req.body.device_token;
        newuser.device_os = req.body.device_os;
        common.findExistingUser(req.body.username, req.body.email, (err, result, type) => {
            if (err) {
                return res.json({
                    success: 0,
                    message: err,
                    data: ''
                });
            } else if (result) {
                if (type == "email") {
                    return res.json({
                        success: 0,
                        message: "email  is already registered",
                        data: ''
                    });
                } else {
                    return res.json({
                        success: 0,
                        message: "username is already registered",
                        data: ''
                    });
                }
            } else if (!result && type == "notfound") {
                newuser.save(function (err) {
                    if (err) {
                        return res.json({
                            success: 0,
                            message: err,
                            data: ''
                        });
                    } else {
                        var msg = {
                            title: "Welcome",
                            body: "user account is created"
                        }
                        send_notification.sendNotification(newuser._id, "", msg)
                        var token = common.generateAccessToken(newuser.toJSON());
                        return res.json({
                            success: 1,
                            message: "user account is created",
                            profile_pick: newuser.profile_pick,
                            user: newuser.username,
                            user_token: token
                        });
                    }
                });
            }
        })
    } else {
        return res.json({
            success: 0,
            message: "All fields are required",
            data: ''
        });
    }
    //}
     // else {
    //     return res.json({
    //         success: 0,
    //         message: "Please upload Image file",
    //         data: ''
    //     });
    // }
}

exports.login = function(req, res){
    console.log("Authentication Login")
    console.log(req.body);
    if(req.body.username && req.body.password && req.body.device_token && req.body.device_os){
        user.findOne({'username': req.body.username}, function(err, found){
            if (err){
                return res.json({
                    success: 0,
                    message: err,
                    data: ''
                });
            }

            if (!found) {
                return res.json({
                    success: 0,
                    message: "User not found",
                    data: ''
                });
            }

            if (found.validPassword(req.body.password)){
                console.log(process.env.ACCESS_TOKEN_SECRET)
                var token = common.generateAccessToken(found.toJSON());
                user.findByIdAndUpdate(found._id, {device_token: req.body.device_token, device_os: req.body.device_os}, {new: true});
                return res.json({
                    success: 1,
                    message: "LoggedIn",
                    profile_pick: found.profile_pick,
                    user: found.username,
                    user_id:found._id,
                    user_token: token,
                });
            } else {
                return res.json({
                    success: 0,
                    message: 'username Or Password Does Not Match.',
                    data: ''
                });
            }
        });
    } else {
        return res.json({
            success: 0,
            message: "all field required for login",
            data: ''
        });
    }
}

// ==================== map integration apis ========================

exports.lat_long = function(req, res){
    exports.findOrCreate = function(req, res){
        jwt.verify(req.token, process.env.ACCESS_TOKEN_SECRET, (err, found) =>{
            if(err){
                return res.json({
                    success: 0,
                    message: err,
                    data: ''
                });
            } else {
                if(req.body.current_lat && req.body.current_long && req.body.pin_icon_type){
                    return res.json({
                        success: 0,
                        message: "Under Construction",
                        data: ''
                    });
                } else {
                    return res.json({
                        success: 0,
                        message: "All fields are required",
                        data: ''
                    });
                }
            }
        });
    }
}

// ========================UPDATE==========================================


exports.updateUser = (req, res) => {
    if (!req.body) {
      return res.status(400).send({
        message: "Data to update can not be empty!"
      });
    }
  
    const id = req.params.id;
  
    user.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
      .then(data => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update User with id=${id}. Maybe User was not found!`
          });
        } else res.send({ message: "User was updated successfully." });
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating User with id=" + id
        });
      });
  };



// ========================= Add New Pin point in DB with user ID =========
exports.addNewPinPoint = async function(req,res){
    console.log("Add_new_pin_point")
    console.log("\n",req.body)
    const {lat,long,user_token,username, user_id, type,message, circle_id } = req.body
    
    //if (lat && long && user_token && username && type && circle_id) {
    if (lat && long && user_token && username && type) {
		// jwt.verify(req.token, process.env.ACCESS_TOKEN_SECRET, (err, found) =>{
		//  pin.save()
		// })
		var pin_ponts = new pin();
		pin_ponts.user = user_id;
		pin_ponts.lat = lat;
		pin_ponts.long = long;
		pin_ponts.pin_icon_type = type;
        pin_ponts.message = message;
        pin_type
        pin_ponts.circle_id = circle_id;
        
		pin_ponts.save((err, saved) => {
			if (err) {
				return res.json({
					success: 0,
					message: err || "Unable to add pin points",
					data: "",
				});
			} else {
				var token = common.generateAccessToken(pin_ponts.toJSON());
				let create_group = new chat_group();
				create_group.pin_id = saved._id;
				create_group.members.push(user_id);
				create_group.save(async (err, done) => {
					let find_user = await user.findById(user_id);
					find_user.chat_group_id.push(done._id);
					await find_user.save();
					return res.json({
						success: 1,
						message: "pin point added sucessfully",
						user: username,
						user_token: token,
					});
				});
			}
		});
	} else {
		return res.json({
			success: 0,
			message: "All fields are required",
			data: "",
		});
	}
}

// ==================================================================

// ================================== Get All pin points using current location=====
exports.getAllPinPoints = function (req, res){
    console.log("=== Get All Pin Points Here ====")
    const {lat,long} = req.body
    if(lat && long){
///======== createa aaggregation ==========

// console.log('reqestis-',req.body);
let user_id= req.body.user_id;
usercirclesModel.find({$or:[{user_id:user_id},{circles_user_id:user_id}]},(err1,res1)=>{
    if(err1){
        return res.json({
            status:false,
            message:'Some error occoured.'
        })
    }else{
        let arr = [];
        res1.map(item=>{
            // console.log('frienditem-',item)
            let friend_id = item.user_id==user_id ? item.circles_user_id:item.user_id;
            item.users_type.map(item1=>{
                arr.push({user:friend_id,circle_id:item1})
            })
        })
        map_lat_longModel.find({$or:[{circle_id:'Public'},{circle_id:null},{user:user_id},...arr]},{_id:1},(err2,res2)=>{
            if(err2){
                return res.json({
                    status:false,
                    message:'Some error occoured.'
                })
            }else{
                console.log('pinsresult-',res2)
                let arr1=[]
                res2.map(item=>{
                    arr1.push(item._id)
                })
                 user.collection.aggregate([
                    { $lookup:
                    {
                        from: 'map_lat_longs',
                        localField: '_id',
                        foreignField: 'user',
                        as: 'orderdetails'
                    }
                    },
                    
                    ]).toArray(function(err, pin_users) {
                    if (err) throw err;
                    console.log("========= GET the data to get data")
                    // console.log(JSON.stringify(pin_users));
                    return res.json({
                        status:true,
                        message:"Get response sucessufully",
                        data:pin_users,
                        pin_data:arr1
                    })
                });
                
            }
            // console.log('pinsresult-',res2)
        })
    }
    // console.log('alluserfriends-',res1)
})

//======================================
    }   
    // return res
}

exports.getAllFilterdPinPoints = function (req,res){
    console.log("== Post GetAllFilterdPinPoints")
    const {lat,long,type} = req.body
    if(lat && long){
        ///======== createa aaggregation ==========
         user.collection.aggregate([
            { $lookup:
               {
                 from: 'map_lat_longs',
                  localField: '_id',
                  foreignField: 'user',
                 as: 'orderdetails'
               }
             },
             {
                $project: 
                {
                  name: 1,
                  orderdetails: 
                  { 
                    $filter: 
                    { 
                      input: "$orderdetails", 
                      as: "filterValues", 
                      cond: { $eq: [ "$$filterValues.pin_icon_type",type ] } 
                    } 
                  } 
                } 
              }
             
            
            ]).toArray(function(err, pin_users) {
            if (err) throw err;
            console.log("========= GET the data to get data")
            console.log(JSON.stringify(pin_users));
            return res.json({
                status:true,
                message:"Get response sucessufully",
                data:pin_users
            })
          });
        //======================================
            }  

}


exports.addUsersInCircle = function(req,res){
    console.log(req.body);
  const {user_id,circles_user_id,users_type} = req.body;

  
  if(user_id && circles_user_id && users_type ){
   
  user.findOne({"_id":user_id}, function(err,data){
        
        if(err){
            res.send({
                code:400,
                message:"unable to find user in DB. Please try with other users",
                Error:err.message
            })
        }else{
            console.log("======>data===> ",data)
            user_circle_model.find({$or:[{user_id:user_id,circles_user_id:circles_user_id},{user_id:circles_user_id,circles_user_id:user_id}]},(err1,arr1)=>{
                if(err1){
                    res.send({
                        code:400,
                        message:"Some error occoured."
                    })
                }else{
                    if(arr1.length>0){
                        if(Array.isArray(arr1[0].users_type) && arr1[0].users_type.includes(users_type)){
                            res.send({
                                code:200,
                                message:`User is already in your `+users_type+` circle.`,
                                data:arr1[0]
                            })
                        }else{
                            let a = Array.isArray(arr1[0].users_type)?arr1[0].users_type:[arr1[0].users_type];
                            user_circle_model.updateOne({user_id:arr1[0].user_id,circles_user_id:arr1[0].circles_user_id},{users_type:[...a,users_type]},(err2,arr2)=>{
                                if(err2){
                                    res.send({
                                        code:400,
                                        message:"Some error occoured.",
                                        err:err2
                                    })
                                }else{
                                    res.send({
                                        code:200,
                                        message:'User added sucessfully',
                                        data:arr2
                                    })
                                }
                            })
                        }
                        
                    }else{
                        const add_user_in_circle = new user_circle_model()
                        add_user_in_circle.user_id = user_id;
                        add_user_in_circle.circles_user_id = circles_user_id;
                        add_user_in_circle.users_type = [users_type];
                        add_user_in_circle.save(function(err,data){
                            if(err){
                                res.send({
                                    code:400,
                                    message:"unable to add this type users"
                                })
                            }else{
                                res.send({
                                    code:200,
                                    message:'User added sucessfully',
                                    data:data
                                })
                            }
                        })
                    }
                }
            })
            
        }
  })
          }else {
              res.send({
                  code:500,
                  message:"All fileds is reqired"
              })
          }
    
}



exports.get_all_cicles_users = async function(req,res){
 
    const {user_id} = req.body;

   console.log("User ID ==>",user_id);
   var list_of_users_id = []

   


    if(user_id){
       console.log("GET USER ID ==>",user_id)

       user_circle_model.find({'user_id': user_id})
       .then(function(data){
        console.log("GET USER DATA ==>")
        var circleUsers = {}
        var storageArray = data.map(async function(id) { 
            console.log("GET DATA ___>>>",id.circles_user_id)
            // user.findOne({_id: id.circles_user_id }).exec()
           var allUsersProfileData = await user.findOne({_id: id.circles_user_id }).exec()
           circleUsers = {circle_users_data:allUsersProfileData, circle_users_type:id.users_type}
                       console.log("GET newData ___>>>",circleUsers)
           return circleUsers
        });
        console.log("GET storreArray ___>>>",storageArray)
        return Promise.all(storageArray);
      }).then(function(storageList){
        res.send({code:200,message:"Sucessfully get data",data:storageList})
        console.log("RESPONSE ++>",storageList);
      });





        // user_circle_model.find({"user_id":user_id},function(err,data){
        //     console.log("Find users ==>",err ,'=====>',data)
              
        //     if(err){
        //         console.log("Error ==>",err)
        //         return res.send({
        //             error:400,
        //             message:'You do not have any group now',
        //             errormessage:err.message
        //         })
        //     }else{
        //         console.log("Else  ==>", data.user_id, '===',user_id)
                
               
        //         // if(data.user_id == user_id){
        //         //   user.findById(data.circles_user_id, function(err,resposne){
        //         //     if(err){
        //         //         return res.send({
        //         //             code:400,
        //         //             message:'Unable to find group from login use',
        //         //             error:err.message
        //         //         })
        //         //     }else{
        //         //         return res.send({
        //         //             code:200,
        //         //             message:'Sucessfully get group users',
        //         //             data:resposne
        //         //             })
        //         //     }
                    

        //         //   })
        //         // }else{
        //         //     console.log("Unable to fins useese ===> ",)
        //         //     return res.send({
        //         //         code:400,
        //         //         message:'Unable to find users'
        //         //     })
        //         // }
              
        //     }
        // })


    }else{
        res.send({
            error:400,
            message:'Unable to find user from current login user'
        })
    }




}

// ============ create chat room  and show chat history =============




exports.findOrCreate = function(req, res){

	if(req.body.user_id && req.body.other_user_id) {
		common.chatData(req.body.user_id, req.body.other_user_id, (err, result)=>{
			if(err){
				return res.json({
					code:201,
					success: false,
					message: err
				});
			} else {
				return res.json({
					code:200,
					success: true,
					message: result
				});
			}
		})
	} else {
		return res.json({
			code:201,
			success: false,
			message: "input filled empty"
		});
	}
}

exports.getOldChatList = function(req, res){

	if(req.body.user_id){
		chat.find({$or: [{userOne: req.body.user_id},{ userTwo: req.body.user_id}]}, 'userOne userTwo')
		.populate('userOne userTwo', '_id username country profile_pick email')
		.exec(function(err, chatId){
			if(err){
				return res.json({
					message:err,
					code:201,
					success: false,
				});
			} else if(chatId){

				return res.json({
					message:"chat list",
					code:201,
					success: true,
					chat_list: chatId,
				});
			} else {
				return res.json({
					message:"chat list empty",
					code:201,
					success: false,
				});
			}
		});
	} else {
		return res.json({
			message:"parameter cannot be empty",
			code:201,
			success: false,
		});
	}
}

// ==================================================================

// ========================= notification ===========================
exports.getNotificationHistory = function(req, res){
    var limits = 30;
    var skip= 0;
    if(!req.body.limits){
        limits = 30;
    } else {
        limits = req.body.limits
    }
    user.findById(req.params.id, function(err, found){
        if(err){
            return res.json({
                message:err,
                code:201,
                success: false,
            });
        } else {
            if(found){
                console.log(limits);
                notification_history.find({userid: req.params.id}).count(function(err, counted){
                    if(err){
                        return res.json({
                            message:err,
                            code:201,
                            success: false,
                        });
                    } else {
                        var i = Math.ceil((counted / limits));
                        var	page = parseInt(req.body.page_number);
                            if (page == 1 || page == 0) {
                                skip = 0
                            } else {
                                skip = (limits * (page - 1))
                            }

                        notification_history.find({userid: req.params.id}, 'status message route type actions time date active admin request createdAt')
                        .populate('admin', 'firstname lastname p_image')
                        .populate('request')
                        .sort({createdAt:'desc'})
                        .skip(skip)
                        .limit(limits)
                        .exec(function(err, history){
                            if(err){
                                return res.json({
                                    message:err,
                                    code:201,
                                    success: false,
                                });
                            } else {
                                if(history){
                                    return res.json({
                                        message:"found history",
                                        code:200,
                                        success: true,
                                        total_pages: i,
                                        data: history
                                    });
                                } else {
                                    return res.json({
                                        message:"no data",
                                        code:201,
                                        success: false,
                                    });
                                }
                            }
                        })
                    }
                })
            } else {
                return res.json({
                    message:"user not found",
                    code:201,
                    success: false,
                });
            }
        }
    })
}
// ==================================================================

// ========================= get user profile =======================
exports.getProfileInfo = function(req, res){
    jwt.verify(req.token, process.env.ACCESS_TOKEN_SECRET, (err, found) =>{
        // console.log('foundis-',found)
        // console.log('foundis1-',err)
        // console.log("requestis",req.query)
        if(err){
            return res.json({
                success: 0,
                message: err,
                data: ''
            });
        } else {
            if(req.query.id){
                user.findById(req.query.id, function(err, founded){
                    if(err){
                        return res.json({
                            success: 0,
                            message: err,
                            data: ''
                        });
                    } else if(founded){
                        user_circle_model.find({$or:[{user_id:founded._id},{circles_user_id:founded._id}]},(err1,arr1)=>{
                            if(err1){
                                return res.json({
                                    success: 0,
                                    message: err1,
                                    data: ''
                                });
                            }else{
                                // console.log('friendsarr=',arr1);
                                let friends = [];
                                arr1.map((item,index)=>{
                                    if(item.users_type.includes('friends')) {
                                        if(item.user_id==founded._id){
                                            friends.push(item.circles_user_id)
                                        }else if(item.circles_user_id==founded._id){
                                            friends.push(item.user_id)
                                        }
                                    };
                                })
                                // console.log('uuuuuu1-',friends)
                                user.find({_id:{$in:friends}},{username:1,email:1,country:1,profile_pick:1,},(err2,arr2)=>{
                                    // console.log('uuuuuu-',arr2)
                                    return res.json({
                                        success: 1,
                                        message: "User Info",
                                        profile_pick: founded.profile_pick,
                                        user: founded.username,
                                        country: founded.country,
                                        user_id:founded._id,
                                        friends_count:arr1.length,
                                        friends:arr2
                                        // friend_circle_count
                                    });
                                })
                                
                            }
                        })
                        
                    } else {
                        return res.json({
                            success: 0,
                            message: "user not found",
                            data: ''
                        });
                    }
                })
            }else{
                user.findById(found._id, function(err, founded){
                    if(err){
                        return res.json({
                            success: 0,
                            message: err,
                            data: ''
                        });
                    } else if(founded){
                        return res.json({
                            success: 1,
                            message: "User Info",
                            profile_pick: founded.profile_pick,
                            user: founded.username,
                            country: founded.country,
                            user_id:founded._id
                        });
                    } else {
                        return res.json({
                            success: 0,
                            message: "user not found",
                            data: ''
                        });
                    }
                })
            }
            
            
        }
    });
}
// ==================================================================

// ============================= just for testing ===================
exports.testing = function(req, res){

    var msg = {
        title: "Welcome",
        body: "user account is created"
    }
    send_notification.sendNotification(req.body.user_id, "", msg)
    return res.json({
        message: "vishal"
    })
}
// ==================================================================

// ==================== group chat list and box =====================
    exports.join_group_find = async (req, res) => {
        try{
            const { pin_id, user_id } = req.body;
            if(!pin_id || !user_id){
                return res.json({
                    success: 0,
                    message: "fields required",
                    fileds: "pin_id, user_id"
                });
            }
            let find_pin = await pin.findById(pin_id);
            let find_user = await user.findById(user_id)
            if(!find_pin) {
                return res.json({
                    success: 0,
                    message: "wrong pin id",
                });
            }
            if(!find_user) {
                return res.json({
                    success: 0,
                    message: "wrong user id",
                });
            }

            let find_group = await chat_group.findOne({ pin_id: pin_id }, {chat:0}).populate("members");
            let only_chat = await chat_group
                .findOne({ pin_id: pin_id }, { members:0, chat: {$slice:-100} });
            
            console.log("chat data", find_group);
            if(find_group) {
                console.log("============ group found ==============");
                let finding_user = find_group.members.map(member => member._id).indexOf(user_id);
                if(finding_user == -1){
                    find_user.chat_group_id.push(find_group._id)
                    await find_user.save();
                    find_group.members.push(user_id);
                    await find_group.save();
                    let userUpdateChatGroup = await user.findById(user_id);
                    userUpdateChatGroup.chat_group_id.push(find_group._id);
                    await userUpdateChatGroup.save();
                }
                return res.json({
                    success: 1,
                    chat: only_chat
                })
            } else {
                console.log("=============")
                let create_group = new chat_group()
                create_group.pin_id = pin_id;
                create_group.members.push(user_id);

                let newData = await create_group.save();
                console.log(newData);
                let userUpdateChatGroup = await user.findById(user_id);
                userUpdateChatGroup.chat_group_id.push(newData._id);
                await userUpdateChatGroup.save();
                let freshData = await chat_group.findById(newData._id).select({chat:{$slice:-100}, members:0});
                return res.json({
                    success: 1,
                    chat: freshData
                });
            }

        } catch (err) {
            return res.json({
                success: 0,
                message: "server Error",
                error: err
            });
        }
    }

    exports.group_chat_list = async (req, res) => {
        try{
            if(req.body.user_id){
                let lists = await user.findById(req.body.user_id, 'chat_group_id').populate('chat_group_id');
                if(!lists) {
                    return res.json({
                        success: 0,
                        message: "user not found"
                    })
                }
                return res.json({
                    success: 1,
                    chat: lists
                });
            } else {
                return res.json({
                    success: 0,
                    message: "user_id required"
                })
            }
        } catch (err) {
            return res.json({
                success: 0,
                message: "server Error",
                error: err
            });
        }
    }
// ==================================================================