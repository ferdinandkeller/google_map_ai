# Datasets

This folder is all about data extraction and cleaning.

Here is what we do :
- We find a dataset containing a list of cities, as well as their GPS locations (latitude, longitude).
- We create pairs of cities randomly
- For each pair we created, we use use web-scrapping to extract the time it would take to go from city A to city B

> **_important note:_** You will need to run the script for quite a long time to extract enough data points to properly train your neural network, so be patient. The good part is that once the data is extracted, you can train whatever network you wish, how many times you wish. Of course the exact number of data points needed will depend on the area you want to cover (France is smaller than the US), but I found that having a few thousands datapoints worked well enough for my country.

## Cities

So before training anything, we need to get our hands on some data. And before loading Google Map's data, we need to find a list of cities as well as their GPS location. I downloaded the citie's data from [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/regions-departements-villes-et-villages-de-france-et-doutre-mer/) and saved in the `cities.json` file. I used French cities in this case.

## Time distances

Now that we have the cities GPS locations, we can extract data from Google Map using the script inside the `gm_scraper` folder. This script uses puppeteer to find the time distances, and saves them to `trips.json`.