import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
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
  // Get information of all visited countries in a javascript object
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach( (country) => {
    countries.push(country.country_code);
  });

  return countries;
}

/***********************************************************/
/******             Route Handling                    ******/
/***********************************************************/
// GET Homepage
app.get("/", async (req, res) => {
  try {
    // Get ONLY the country codes 
    let countries = await checkVisited()
    
    // Render homepage
    res.render("index.ejs", {
      countries: countries, 
      total:  countries.length, 
    })
  } catch (err) {
    console.error("Error executing query", err.stack);
  }
});

// INSERT new country
app.post("/add", async (req, res) => {
  try {
    const input = req.body.country;

    // Search for country code 
    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1", 
      [input]
    );
    
    const data = result.rows[0];
    const countryCode = data.country_code;  
    try {
      // Add country to visited list 
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)", 
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
        console.log(err);
         // Repeated Country 
        let countries = await checkVisited();
        res.render("index.ejs", {
          countries: countries, 
          total:  countries.length, 
          error: 'Country has already been added, please try again.'
        });
    }
  } catch (err) {
    console.log(err);
    // Invalid Country
    let countries = await checkVisited();
    res.render("index.ejs", {
      countries: countries, 
      total:  countries.length, 
      error: 'Country does not exist, please try again.'
    });
  }  
});

// Start up server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
