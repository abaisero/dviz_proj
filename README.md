# NOTE

This tool was developed for use on the following system:
 - Debian 9.1 stretch
 - Firefox 52.5.0 (64-bit)
 - Screen resolution: 1920x1080

No guarantees of proper functioning are given for any other combination of
operating system, browser, or screen resolution.

###############################################################################

# Installation

To install the node dependencies, run

`> npm install`

Before moving on, you have to make sure to join together all the data-files,
which have been split to satisfy github's maximum file size.  Temporarily move
into the data folder, and run

`> ./join`

To create and fill the database, go back to the main folder, and run

`> node import_data [--species] [--samples] [--aggregate] [--port <port>]`
    - `--species`: imports species data
    - `--sample`: imports sample data
    - `--aggregate`: merges samples which share the same region, lat/long, date, and species
        + uses weighted average for depth and length
        + prunes pre-aggregation data, considerably reducing DB size
    - `--port`: if provided, starts the server in the background on the given port

To run the server, run

`> node server [--port <port>]`
    - `--port`: starts the server on the given port (default 1337)

The application can now be used at http://localhost:<port>/
