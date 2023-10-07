const users = [];

const addUser = ({ id, name, room }) => {
    name = name.trim().toLowerCase();
    room = room.trim().toLowerCase();

    console.log('addUser()',name,'in room',room);
    console.log('current users: ',users);

    const existingUser = users.find((user) => {
        return user.room === room && user.name === name;
    });

    if (existingUser) {
        return { error: "Username is taken" };
    }

    const position = {x:0,y:0,degrees:0};
    const user = { id, name, room, position };

    users.push(user);
    console.log('updated users: ',users);
    return { user };
};

const removeUser = (name) => {
    console.log("REMOVE USER",name);
    console.log("Users: ",users);
    if(name){
        name=name.trim().toLowerCase();
        const index = users.findIndex((user) => {
            return user.name === name;
        });
        console.log("index: ",index);
        if (index !== -1) {
            return users.splice(index, 1)[0];
        }
    }
};

const getUser = (name) => {
    if(name){
        return users.find((user) => user.name === name?.trim().toLowerCase());
    }
}

const getUsersInRoom = (room) => users.filter((user) => user.room === room?.trim().toLowerCase());

export { addUser, removeUser, getUser, getUsersInRoom };
