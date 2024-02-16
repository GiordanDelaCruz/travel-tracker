import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db =  new pg.Client({
  user: "postgres", 
  host: "localhost", 
  database: "world", 
  password: "!CryoGoat122", 
  port: 5432
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

db.connect();   // Connect to database

/***********************************************************/
/******          Custom Functions                     ******/
/***********************************************************/
async function checkVisited(){
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach( (country) => {
    countries.push(country.country_code);
  });
}

/***********************************************************/
/******             Route Handling                    ******/
/***********************************************************/
// Get Homepage
app.get("/", async (req, res) => {
  //Write your code here.
  try {

    // Get information of all visited countries in a javascript object
    const result = await db.query(
      "SELECT country_code FROM visited_countries"
    );

    // Get ONLY the country codes 
    let codeArr = [];
    for(let i = 0; i < result.rows.length; i++){   
      codeArr.push(result.rows[i].country_code);
    }

    // db.end();  // Close database for good pratice
    
    // Render homepage
    res.render("index.ejs", {
      countries: codeArr, 
      total:  codeArr.length, 
    })
  } catch (err) {
    console.error("Error executing query", err.stack);
  }
});

// Handle POST request of new visited country
app.post("/add", async (req, res) => {
  try {
    // Get user input
    const input = req.body.country;

    // Search for country code 
    const result = await db.query("SELECT country_code FROM countries WHERE country_name = $1", [input]);
    console.log(result);

    // Add country to visited list 
    if( result.rows.length !== 0){
      db.query("INSERT INTO visited_countries(country_code) VALUES($1)", [result.rows[0].country_code])
    }else{
      console.log("Country code not found.");

      // Invalid Country
      req.session.error = 'Country does not exist, please try again.';
      res.redirect("/");
    }
    // Redirect to homepage
    res.redirect("/");
    
  } catch (error) {
    // Repeated Country 
    req.session.error = 'Country has already been added, please try again.';
    res.redirect("/");
  }  
});

// Start up server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
