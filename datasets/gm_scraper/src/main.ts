import { readFileSync, appendFile, truncate, stat, writeFile } from 'fs'
import puppeteer from 'puppeteer'
import consola from 'consola'
import { SingleBar, Presets } from 'cli-progress'

import type { Browser } from 'puppeteer'

/**
 * Interface describing the structure of a city inside the dataset.
 */
interface DatasetCity {
  id: number
  department_code: string
  insee_code: string
  zip_code: string
  name: string
  slug?: string
  gps_lat: number
  gps_lng: number
}

/**
 * Generate a integer number in the range given (min inclusive, max exclusive).
 * @param min minimum value
 * @param max maximum value
 * @returns 
 */
function random (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min + 1
}

/**
 * Interface that describes the data structure of a city.
 */
interface City {
  name: string,
  lat: number,
  lng: number
}

/**
 * Generate a random city pair.
 * @returns 
 */
function random_city_pair (): { start_city: City, end_city: City } {
  let start_city_index = random(0, city_count)
  let start_city: City = {
    name: cities[start_city_index].name,
    lat: cities[start_city_index].gps_lat,
    lng: cities[start_city_index].gps_lng
  }

  let end_city_index = random(0, city_count)
  let end_city: City = {
    name: cities[end_city_index].name,
    lat: cities[end_city_index].gps_lat,
    lng: cities[end_city_index].gps_lng
  }

  return { start_city, end_city }
}

/**
 * Interface describing the structure of a trip.
 */
interface Trip {
  start_city: City,
  end_city: City,
  duration?: number
}

/**
 * Generate a random trip between two cities and compute its duration. If an error occurs, returns no value for duration.
 * @param browser an instance of puppeteer.Browser
 * @returns 
 */
async function generate_random_trip (browser: Browser): Promise<Trip>  {
  try {
    // generate a random city pair
    var { start_city, end_city } = random_city_pair()
  
    // create a new page
    var page = await browser.newPage()
    await page.goto(`https://www.google.com/maps/dir/${start_city.name}/${end_city.name}`)
  
    // switch to the car panel
    let car_button
    try {
      car_button = await page.waitForSelector('button [aria-label="Voiture"]')
    } catch {
      car_button = await page.$('button [aria-label="Voiture"]')
    }
    await car_button.click()
    
    // retrieve the duration div
    let duration_div
    try {
      duration_div = await page.waitForSelector('[data-trip-index="0"] [jstcache="193"]')
    } catch {
      duration_div = await page.$('[data-trip-index="0"] [jstcache="193"]')
    }
  
    // extract the duration from the span and parse it
    let duration_str: string = await duration_div.evaluate(el => el.textContent.split(' '))
    let duration: number = 0
    if (duration_str.length === 2) {
      if (duration_str[1] === 'min') {
        duration = parseInt(duration_str[0])
      } else {
        duration = parseInt(duration_str[0]) * 60
      }
    } else {
      duration = parseInt(duration_str[0]) * 60 + parseInt(duration_str[2])
    }
  
    // close the page
    await page.close()
  
    // return the computed duration
    return { start_city, end_city, duration }
  } catch {
    try {
      await page.close()
    } finally {
      return { start_city, end_city }
    }
  }
}

/**
 * Scrap the data from Google Map, and save the scraped data to a JSON file
 */
async function scrap_data() {
  // log that we are starting the scraping process
  consola.info(`Generating ${set_count} sets of ${city_pairs_per_set} city pairs`)

  // create a browser
  let browser = await puppeteer.launch({ headless: true })

  // create a progress bar
  let progress_bar = new SingleBar({
    hideCursor: true,
  }, Presets.shades_classic)
  progress_bar.start(set_count, 0)

  // count successful extractions
  let successful_extractions = 0

  // get the data
  for (let i=0; i<set_count; i++) {
    // find trips
    // let trips: Trip[] = await Promise.all(new Array(city_pairs_per_set).fill(generate_random_trip(browser)))
    let trips: Trip[] = await Promise.all([
      generate_random_trip(browser),
      generate_random_trip(browser),
      generate_random_trip(browser)
    ])

    // save the new trips in a file
    let successful_trips = trips.filter(trip => trip.duration !== undefined).map(trip => {
      return {
        start_city_name: trip.start_city.name,
        start_city_lat: trip.start_city.lat,
        start_city_lng: trip.start_city.lng,
        end_city_name: trip.end_city.name,
        end_city_lat: trip.end_city.lat,
        end_city_lng: trip.end_city.lng,
        duration: trip.duration
      }
    })
    successful_extractions += successful_trips.length
    if (successful_trips.length > 0) {
      stat(output_filename, (_, stats) => {
        if (stats === undefined) {
          writeFile(output_filename, '[\n  ' + successful_trips.map(trip => JSON.stringify(trip)).join(',\n  ') + '\n]\n', () => {})
        } else {
          truncate(output_filename, stats.size-3, () => {
            appendFile(output_filename, ',\n  ' + successful_trips.map(trip => JSON.stringify(trip)).join(',\n  ') + '\n]\n', () => {})
          })
        }
      })
    }

    // update the progress bar
    progress_bar.update(i + 1)
  }

  // remove the progress bar
  progress_bar.stop()

  // close the browser
  await browser.close()
  consola.success('Data extraction done')
  consola.info(`${successful_extractions}/${set_count * city_pairs_per_set} successful extractions`)
}

// start data extraction
const input_filename = '../cities_france.json'
const output_filename = '../trips_france.json'
const cities: DatasetCity[] = JSON.parse(readFileSync(input_filename, 'utf-8'))
const city_count = cities.length
const set_count = 10
const city_pairs_per_set = 20
scrap_data()
