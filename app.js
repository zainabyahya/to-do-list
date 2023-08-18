//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const { Schema } = mongoose;



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Set up default mongoose connection
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

// Mongoose Schema for individual to-do list items
const itemSchema = new Schema({
  name: String
});

const Item = mongoose.model('Item', itemSchema);

// Mongoose Schema for custom lists
const listSchema = {
  name: String, 
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

// Default route for the home page
app.get("/", function (req, res) {

  // Find all items in the collection
  Item.find({}).then(function (foundItems) {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  })
    .catch(function (err) {
      console.log(err);
    });

});

// Custom route for dynamic lists
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  // Find a list with the custom list name
  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        // Create a new list if it doesn't exist
        const list = new List({
          name: customListName,
          items: [],
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      } else {
        // Render the existing custom list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });

});

// Route for adding new items
app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Check if itemName is not an empty string
  if (itemName.trim() !== '') {
    // Create a new item based on the input
    const item = new Item({
      name: itemName,
    });

    if (listName === "Today") {
      // Save the item to the default collection
      item.save();
      res.redirect("/");
    } else {
      // Find the custom list and push the new item
      List.findOne({ name: listName })
        .then((foundItems) => {
          foundItems.items.push(item);
          foundItems.save();
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } else {
    if (listName === "Today") {
      res.redirect("/");
    } else {
      List.findOne({ name: listName })
        .then((foundItems) => {
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  
});

// Route for deleting items
app.post("/delete", function (req, res) {

  const listName = req.body.listName;
  const checkItemId = req.body.checkbox;

  // Delete the item from the default collection
  if (listName == "Today") {
    deleteCheckedItem();
  } else {
    // Find the custom list and pull the item from the array
    deleteCustomItem();
  }

  async function deleteCheckedItem() {
    await Item.deleteOne({ _id: checkItemId });
    res.redirect("/");
  }

  async function deleteCustomItem() {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } }
    );
    res.redirect("/" + listName);
  }
});

// About Page
app.get("/about", function (req, res) {
  res.render("about");
});

// Start the server at Port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
