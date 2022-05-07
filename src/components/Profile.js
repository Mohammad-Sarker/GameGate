import Review from "./Review";
import { useParams } from "react-router-dom";
import * as AWS from 'aws-sdk';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

var myCredentials = new AWS.CognitoIdentityCredentials({IdentityPoolId:'us-east-1:1f1634e0-e85f-4ffe-a509-ecb75c777309'});
var myConfig = new AWS.Config({
  credentials: myCredentials, region: 'us-east-1'
});

AWS.config.update(myConfig)

const docClient = new AWS.DynamoDB.DocumentClient()

const Profile = (props) => {
    const [results, setResults] = useState(null);
    const [isPending, setPending] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState(null);
    const [reviewInfo, setReviewInfo] = useState([]);
    const [following, setFollowing] = useState(false);
    const [notFollowing, setNotFollowing] = useState(false);

    const {username} = useParams();

    useEffect(() => {
        if(!requesting && (results === null || results.Username !== username)) {
            // console.log(results);
            // console.log(results, username);
            setRequesting(true);
            var params = {
                TableName: "GameGateAccounts",
                IndexName: "Username-index",
                KeyConditionExpression: "#username = :User3",
                ExpressionAttributeNames: {
                    "#username": "Username"
                },
                ExpressionAttributeValues: {
                    ":User3": username
                }
            }
            
            docClient.query(params, function(err, data) {
                if(err) {
                    console.log('Could not retrieve information for that user');
                    setError('Could not retrieve information for that user');
                    setPending(false);
                } else if(data.Count === 0) {
                    console.log('User does not exist');
                    setError('User does not exist');
                    setPending(false);
                }
                else {
                    setResults(data.Items[0]);
                    setPending(false);
                    setError(null);
                }
            })

            var params3 = {
                TableName: "Games",
                IndexName: "Email-GameID-index",
                KeyConditionExpression: "#email = :Email3",
                ExpressionAttributeNames: {
                    "#email": "Email"
                },
                ExpressionAttributeValues: {
                    ":Email3": props.currUserInfo.Email
                }
            }
        
            docClient.query(params3, function(err, data) {
                if (!err) {
                    let newReviewInfo = [];
                    if (data.Count === 0) {
                        console.log(data);
                    } else {
                        console.log(data);
                    }
                    for(let i = 0; i < data.Count; i++) {
                        newReviewInfo.push(data.Items[i]);
                    }
                    setReviewInfo(newReviewInfo);
                } else {
                    console.log(err);
                }
                setRequesting(false);
            })
        }
        console.log(following);
        if(props.currUserInfo) {
            // console.log(props.currUserInfo);
            checkFollowing();
            console.log(props.currUserInfo);
        }
    }, [username, props.completion])

    const checkFollowing =  async () => {
        // console.log(props.currUserInfo);
        // console.log(typeof(props.currUserInfo.FollowingMap.values));
        // console.log(typeof(props.currUserInfo.FollowingMap));
        /*if(props.currUserInfo.FollowingMap != undefined) {
            if(typeof(props.currUserInfo.FollowingMap.values) !== typeof(props.currUserInfo.FollowingMap)) {
                // console.log('here');
                props.currUserInfo.FollowingMap.forEach((usernameInfo, userEmail) => {
                    if(usernameInfo.Username === username) {
                        console.log(usernameInfo);
                        setFollowing(true);
                    }
                })
            } else {
                for(let i of props.currUserInfo.FollowingList.values) {
                    if(i === username) {
                        // console.log('here');
                        console.log(props.currUserInfo);
                        setFollowing(true);
                    }
                }
            }
        }*/
        await findUser();


        //console.log(props.currUserInfo.FollowingMap.Username, "yes");
        //console.log(props.currUserInfo.FollowingMap, "yes");
    }

    const findUser = () => {
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": username
            }
        }
    
        const data2 = docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    console.log(data);
                } else {
                    console.log(data);
                    data.Items.forEach(item => {
                        followingStatus(item);
                    })
                }
            }
        })
    }

    const followingStatus = (item) => {
        var params1 = {
            TableName:"GameGateAccounts",
            KeyConditionExpression: "#email = :email3",
            FilterExpression: "attribute_exists(#fl.#userN.Username)",
            ExpressionAttributeNames: {
                "#email": "Email",
                "#fl": "FollowingMap",
                "#userN": item.Email
            },
            ExpressionAttributeValues: {
                ":email3": props.currUserInfo.Email
            }
        };
        console.log(item);
        docClient.query(params1, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data, "working");
                console.log(following);
                if (data.Items.length !== 0) {
                    console.log("went through");
                    setFollowing(true);
                    console.log(following);
                }
            }
        });
    }

     const increaseFollowing = (yourUsername, theirUsername, yourProfilePicture, theirProfilePicture) => { 
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": theirUsername
            }
        }
    
        docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    console.log(data);
                } else {
                    console.log(data);
                    data.Items.forEach(item => {
                        var params1 = {
                            TableName:"GameGateAccounts",
                                Key:{
                                "Email": props.currUserInfo.Email,
                            },
                            UpdateExpression: "SET #fl.#userN = :userViewedName, Following = Following + :val",
                            ConditionExpression: "attribute_not_exists(#fl.#userN.Username)",
                            ExpressionAttributeNames: {
                                "#fl": "FollowingMap",
                                "#userN": item.Email
                            },
                            ExpressionAttributeValues:{
                                ":userViewedName":{
                                    "Username": theirUsername,
                                    "ProfilePicture": theirProfilePicture
                                },
                                ":val": 1
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        console.log(item);
                        docClient.update(params1, function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                let newInfo = Object.assign({}, props.currUserInfo);
                                newInfo.Following = data.Attributes.Following;
                                newInfo.FollowingMap = data.Attributes.FollowingMap;
                                props.setCurrUserInfo(newInfo);
                                localStorage.setItem('user', JSON.stringify(newInfo));
                                console.log(newInfo);
                                console.log("Increased the following count of", yourUsername);
                                const action = yourUsername + " has followed " + theirUsername;
                                console.log(action);
                                var dateTime = new Date();
                                var dateTimeEST = dateTime.toLocaleString('en-US', {timeZone: 'America/New_York'});
                                console.log(dateTimeEST);
                                addUserFeed(props.currUserInfo.Email, yourUsername, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), theirUsername, yourProfilePicture, theirProfilePicture, action, dateTimeEST);
                            }
                        });
                    })
                }
            }
        })
        setFollowing(true);
        increaseFollowers(yourUsername, theirUsername, yourProfilePicture, theirProfilePicture);
    }



    const decreaseFollowing = (yourUsername, theirUsername, yourProfilePicture, theirProfilePicture) => { 
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": theirUsername
            }
        }
    
        docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    console.log(data);
                } else {
                    console.log(data);
                    data.Items.forEach(item => {
                        var params1 = {
                            TableName:"GameGateAccounts",
                                Key:{
                                "Email": props.currUserInfo.Email,
                            },
                            UpdateExpression: "REMOVE #fl.#userN SET Following = Following - :val",
                            ConditionExpression: "attribute_exists(#fl.#userN.Username)",
                            ExpressionAttributeNames: {
                                "#fl": "FollowingMap",
                                "#userN": item.Email
                            },
                            ExpressionAttributeValues:{
                                ":val": 1
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        console.log(item);
                        docClient.update(params1, function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                // console.log(data);
                                console.log("Decreased the following count of", yourUsername);
                                let newInfo = Object.assign({}, props.currUserInfo);
                                newInfo.Following = data.Attributes.Following;
                                newInfo.FollowingMap = data.Attributes.FollowingMap;
                                props.setCurrUserInfo(newInfo);
                                localStorage.setItem('user', JSON.stringify(newInfo));
                                console.log(newInfo);
                                const action = yourUsername + " has unfollowed " + theirUsername;
                                console.log(action);
                                var dateTime = new Date();
                                var dateTimeEST = dateTime.toLocaleString('en-US', {timeZone: 'America/New_York'});
                                console.log(dateTimeEST);
                                addUserFeed(props.currUserInfo.Email, yourUsername, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), theirUsername, yourProfilePicture, theirProfilePicture, action, dateTimeEST);
                            }
                        });
                    })
                }
            }
        })
        setFollowing(false);
        decreaseFollowers(yourUsername, theirUsername, yourProfilePicture, theirProfilePicture);
    }

    const increaseFollowers = (yourUsername, viewedUsername, yourProfilePicture, theirProfilePicture) => {  
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": viewedUsername
            }
        }
    
        docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    // console.log(data);
                } else {
                    // console.log(data);
                    data.Items.forEach(item => {
                        var params1 = {
                            TableName:"GameGateAccounts",
                                Key:{
                                "Email": item.Email,
                            },
                            UpdateExpression: "SET #fl.#userN = :yourUsername, Followers = Followers + :val",
                            ConditionExpression: "attribute_not_exists(#fl.#userN.Username)",
                            ExpressionAttributeNames: {
                                "#fl": "FollowersMap",
                                "#userN": props.currUserInfo.Email
                            },
                            ExpressionAttributeValues:{
                                ":yourUsername":{
                                    "Username": yourUsername,
                                    "ProfilePicture": yourProfilePicture
                                },
                                ":val": 1
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        console.log(item);
                        docClient.update(params1, function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(data);
                                console.log("Increased the followers count of", username);
                                const action = viewedUsername + " has gained the follower " + yourUsername;
                                console.log(action);
                                var dateTime = new Date();
                                var dateTimeEST = dateTime.toLocaleString('en-US', {timeZone: 'America/New_York'});
                                console.log(dateTimeEST);
                                addUserFeed(item.Email, viewedUsername, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), yourUsername, theirProfilePicture, yourProfilePicture, action, dateTimeEST);
                            }
                        });
                    })
                }
            }
        })
    }

    
    const decreaseFollowers = (yourUsername, viewedUsername, yourProfilePicture, theirProfilePicture) => { 
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": viewedUsername
            }
        }
    
        docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    // console.log(data);
                } else {
                    // console.log(data);
                    data.Items.forEach(item => {
                        var params1 = {
                            TableName:"GameGateAccounts",
                                Key:{
                                "Email": item.Email,
                            },
                            UpdateExpression: "REMOVE #fl.#userN SET Followers = Followers - :val",
                            ConditionExpression: "attribute_exists(#fl.#userN.Username)",
                            ExpressionAttributeNames: {
                                "#fl": "FollowersMap",
                                "#userN": props.currUserInfo.Email
                            },
                            ExpressionAttributeValues:{
                                ":val": 1
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        console.log(item);
                        docClient.update(params1, function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(data);
                                console.log("Decreased the followers count of", username);
                                const action = viewedUsername + " has lost the follower " + yourUsername;
                                console.log(action);
                                var dateTime = new Date();
                                var dateTimeEST = dateTime.toLocaleString('en-US', {timeZone: 'America/New_York'});
                                console.log(dateTimeEST);
                                addUserFeed(item.Email, viewedUsername, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), yourUsername, theirProfilePicture, yourProfilePicture, action, dateTimeEST);
                            }
                        });
                    })
                }
            }
        })
    }

    function addUserFeed(yourEmail, yourUsername, idNumber, theirUsername, yourProfilePicture, theirProfilePicture, action, dateTimeEST) {
        var params1 = {
            TableName: "UserFeed",
            IndexName: "ID-Email-index",
            KeyConditionExpression: "#id = :ID3",
            ExpressionAttributeNames: {
                "#id": "ID",
            },
            ExpressionAttributeValues: {
                ":ID3": idNumber
            }
        }
    
        docClient.query(params1, function(err, data) {
            if (err) {
                console.log(err, "ID is already being used generating a new ID");
                addUserFeed(yourEmail, yourUsername, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), theirUsername, yourProfilePicture, theirProfilePicture, action, dateTimeEST)
            }else if (!err) {
                if (data.Count === 0) {
                    console.log(data);
                    var params2 = {
                        TableName:"UserFeed",
                        Item:{
                            "Email": yourEmail,
                            "ID": idNumber,
                            "Username": yourUsername,
                            "Action": action,
                            "theirUsername": theirUsername,
                            "DateOf": dateTimeEST
                        }
                    };
                    docClient.put(params2, function(err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(data)
                        }
                    });
                } else {
                    console.log(data);
                }
            }
        });
    }


    function addUpvote(yourUsername, theirUsername, gameID) { 
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": theirUsername
            }
        }
        console.log(yourUsername, theirUsername, gameID);
        props.docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    console.log(data);
                } else {
                    console.log(data);
                    data.Items.forEach(item => {
                        var params1 = {
                            TableName:"Games",
                                Key:{
                                "GameID": gameID,
                                "Email": item.email
                            },
                            UpdateExpression: "SET #uv.#em = :upvote, UpvotesCount = UpvotesCount + :val" ,
                            ConditionExpression: "attribute_not_exists(#uv.#em.Username)",
                            ExpressionAttributeNames: {
                                "#uv": "Upvotes",
                                "#em": props.Email
                            },
                            ExpressionAttributeValues:{
                                ":upvote": {
                                    "Username": yourUsername,
                                    "ProfilePicture": item.ProfilePic,
                                },
                                ":val": 1,
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        console.log(item);
                        props.docClient.update(params1, function(err, data) {
                            if (err) {
                                console.log(err);
                                removeUpvote(yourUsername, theirUsername, gameID);
                            } else {
                                console.log(data);
                            }
                        });
                    })
                }
            }
        })
        console.log("upvote added");
    }

    function removeUpvote(yourUsername, theirUsername, gameID) { 
        var params2 = {
            TableName: "GameGateAccounts",
            IndexName: "Username-index",
            KeyConditionExpression: "#username = :User3",
            ExpressionAttributeNames: {
                "#username": "Username"
            },
            ExpressionAttributeValues: {
                ":User3": yourUsername
            }
        }
    
        props.docClient.query(params2, function(err, data) {
            if (!err) {
                if (data.Count === 0) {
                    console.log(data);
                } else {
                    console.log(data);
                    data.Items.forEach(item => {
                        var params1 = {
                            TableName:"Games",
                                Key:{
                                "GameID": gameID,
                                "Username": theirUsername
                            },
                            UpdateExpression: "REMOVE #uv.#em SET UpvotesCount = UpvotesCount - :val" ,
                            ConditionExpression: "attribute_exists(#uv.#em.GameName)",
                            ExpressionAttributeNames: {
                                "#uv": "Upvotes",
                                "#em": item.Email
                            },
                            ExpressionAttributeValues:{
                                ":val": 1,
                            },
                            ReturnValues:"UPDATED_NEW"
                        };
                        props.docClient.update(params1, function(err, data) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(data)
                            }
                        });
                    })
                }
            }
        })
        console.log("upvote removed");
    }


    return (
        <div className='profile-topmost'>
            {isPending && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {results && 
            <div className="profile-container">
                <div className="stats-container">
                    <div className='image-section'>
                        <img id="pfp" src={results.ProfilePicture}/>
                    </div>
                    <div>
                        <h2>{username}</h2>
                        {console.log(following, following)}
                        {!following && props.loggedIn && username != props.currUser && <div><button className="list_entry" type="submit" onClick={() => increaseFollowing(props.currUser, username, props.currUserInfo.ProfilePicture, results.ProfilePicture)}>Follow</button></div> }
                        {following && props.loggedIn && username != props.currUser && <div><button className="list_entry" type="submit" onClick={() => decreaseFollowing(props.currUser, username, props.currUserInfo.ProfilePicture, results.ProfilePicture)}>Unfollow</button></div> }
                    </div>
                    <div className="game-stats">
                        <div className="individual-stat-container">
                            <Link to={`/currentG/${username}`}>
                                <h2>{results.CurrentG}</h2>
                                <p>Current</p>
                            </Link>
                        </div>
                        <div className="individual-stat-container">
                            <Link to={`/completed/${username}`}>
                                <h2>{results.Completed}</h2>
                                <p>Completed</p>
                            </Link>
                        </div>
                        <div className="individual-stat-container">
                            <Link to={`/dropped/${username}`}>
                                <h2>{results.Dropped}</h2>
                                <p>Dropped</p>
                            </Link>
                        </div>
                        <div className="individual-stat-container">
                            <Link to={`/planning/${username}`}>
                                <h2>{results.Planning}</h2>
                                <p>Planning</p>
                            </Link>
                        </div>
                    </div>
                    <div className="follow-stats">
                        <div className="individual-stat-container">
                            <Link to={`/followers/${username}`}>
                                <h2>{results.Followers}</h2>
                                <p>Followers</p>
                            </Link>
                        </div>
                        <div className="individual-stat-container">
                            <Link to={`/following/${username}`}>
                                <h2>{results.Following}</h2>
                                <p>Following</p>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="reviews-container">
                    <div>
                        <h1>Reviews</h1>
                    </div>
                    <div className="reviews">
                        {
                            reviewInfo.map(val => (
                                <Review email={props.currUserInfo.Email} yourUsername={props.currUser} username2={val.Username} gameImage={val.GameImage} name={val.GameName} content={val.Review} score={val.Rating} id={val.GameID}  UpvotesCount={val.UpvotesCount} key={val.GameName}/>
                            ))
                        }
                    </div>
                </div>
            </div>
            }
        </div>
    );
}
 
export default Profile;