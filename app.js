const express = require("express");
const bodyParser = require("body-parser");
const mongoose  = require("mongoose");
const _= require("lodash"); // if user enters capital or smallstring same page should open

const app = express();



app.set('view engine', 'ejs'); // This line tells app to use EJS as view engine.

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));  // we need to tell express that we have a styles.css file in the public folder. While using express that's how we use styles.css


mongoose.connect("mongodb+srv://admin-ausaf:ausaF123@cluster0.xynm4.mongodb.net/todolistDB"); // Connecting to Data base

/*  first schema */
const itemsSchema = {
    name: String
}

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button toadd a new item"
});

const item3 = new Item({
    name: "<-- hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

/*  Second schema */
const listSchema = {
    name: String,  // name of list 
    items : [itemsSchema]  // it is going to have an array of item documents
};

const List = mongoose.model("List",listSchema);


app.get("/",function(req,res)
{
    Item.find({}, function(err,foundItems)  // {} finds everything that is is Item collection. We'll send all of this data to list.ejs
    {

        if(foundItems.length == 0)  // if initially no items in DB then we add default items
        {
            Item.insertMany(defaultItems,function(err)
            {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    console.log("Successfully saved default items to DB");
                }
            });
            res.redirect("/") // we redirect it so that in redirection the default items get rendered  to ejs
        }
        else
        {
            res.render("list", { listTitle : "Today" ,newListItems : foundItems});   // we are passing the found items to list.ejs
        }

        
    })

    
});


app.get("/:customListName",function(req,res)  // This is Express routing .customListName is whatever user enetrs after slash. Check on copy "Note" after to do list projct -without backend
{
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err,foundList) //It searches for customListName in DB, if the customListName already does exist then we'll not create a new listin DB
    {
        if(!err)
        {
            if(!foundList)
            {
                // create a new list

                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();  
                res.redirect("/"+customListName);
            }
            else
            {
                // show an existing list

                res.render("list", {listTitle: foundList.name, newListItems : foundList.items})
            }
        }
    })
      
});

app.post("/",function(req,res) 
{
    const itemName = req.body.newItem; 
    const listName = req.body.list;
    
    const item = new Item({  // creating a DB doc
        name:itemName
    });
    
    if(listName == "Today")
    {
        item.save();
        res.redirect("/");
    }
    else
    {
        List.findOne({name: listName}, function(err, foundList){  // in list collection we search for a doc saved with name as listName and then in its items we push the newly added one
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }

   

});

app.post("/delete",function(req,res)
{
    const checkedItemId = req.body.checkbox; 
    const listName = req.body.listName;

    if(listName === "Today")
    {
        Item.findByIdAndRemove(checkedItemId, function(err)  
        {
            if(!err)
            {
                console.log("Succesfully deleted checked item");
                res.redirect("/"); 
            }
        });
    }
    else
    {  // if you don't understand this else part watch last videoof putting everything together
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) // if we want to delete some item from to-do-List of non-Home page we delete it from List collection. But List cooelction has schema which contains array of items, so we have to delete an item from array of items and for that we use "findOneAndUpdate". We use name as "listName" as from where do we want to delete & $pull pulls that item from items array with a particular ID 
        {
            if(!err)
            {
                res.redirect("/"+ listName);
            }
        })
    }

    
    
})
// below code copied from heroku doc
let port = process.env.PORT;
if(port == null || port == "")
{
    port = 3000;
}




app.listen(port,function()
{
    console.log("Server started Successfully");
});

