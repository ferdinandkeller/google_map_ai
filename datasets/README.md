# Datasets

This folder is all about data extraction and cleaning.

Here is what we do :
- We find a dataset containing a list of cities, as well as their GPS locations (latitude, longitude).
- We create pairs of cities randomly
- For each pair we created, we use use web-scrapping to extract the time it would take to go from city A to city B

## Cities

So before training anything, we need to get our hands on some data. And before loading Google Map's data, we need to find a list of cities as well as their GPS location. I downloaded the citie's data from [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/regions-departements-villes-et-villages-de-france-et-doutre-mer/) and saved in the `cities.json` file. I used French cities in this case.

## Time distances

Now that we have the cities GPS locations, we can extract data from Google Map using the script inside the `gm_scraper` folder. This script uses puppeteer to find the time distances, and saves them to `trips.json`.