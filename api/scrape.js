const axios = require('axios');
const cheerio = require('cheerio');

// This is a Vercel Serverless Function.
// It will be available at the URL /api/scrape
module.exports = async (req, res) => {
    console.log('Starting job scraping process...');

    // The target URL to scrape.
    const targetUrl = 'https://www.aerzteblatt.de/aerztestellen';

    try {
        console.log(`Scraping ${targetUrl}`);
        const response = await axios.get(targetUrl);
        const html = response.data;

        // Use the parser function to extract jobs
        const jobs = parseAerzteblatt(html);

        console.log(`Found ${jobs.length} jobs.`);

        // Return the found jobs as a JSON response.
        res.status(200).json(jobs);

    } catch (error) {
        console.error(`Error scraping ${targetUrl}:`, error.message);
        res.status(500).json({ error: `An error occurred while scraping jobs.` });
    }
};

function parseAerzteblatt(html) {
    const $ = cheerio.load(html);
    const jobs = [];

    $('.job-item').each((index, element) => {
        const title = $(element).find('.job-title a').text().trim();
        const link = $(element).find('.job-title a').attr('href');
        const hospital = $(element).find('.job-company').text().trim();
        const city = $(element).find('.job-location').text().trim();
        const description = $(element).find('.job-snippet').text().trim();

        if (title && link && hospital && city) {
            jobs.push({
                title,
                hospital,
                city,
                state: 'Unknown',
                specialty: 'Unknown',
                level: 'Unknown',
                link: `https://www.aerzteblatt.de${link}`,
                description,
                id: `https://www.aerzteblatt.de${link}`,
            });
        }
    });

    return jobs;
}