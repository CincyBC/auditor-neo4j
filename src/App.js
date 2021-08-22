import React, { Component } from "react";
import "./App.css";
import Map from "./components/Map";
// import ReviewSummary from "./components/ReviewSummary";
// import CategorySummary from "./components/CategorySummary";
import neo4j from "neo4j-driver/lib/browser/neo4j-web";

class App extends Component {
  constructor(props) {
    super(props);
    let focusedInput = null;

    this.state = {
      focusedInput,
      singleFamily: [],
      starsData: [],
      categoryData: [],
      selectedBusiness: false,
      totalValue: 0,
      totalAbate: 0,
      avgAbate: 0,
      mapCenter: {
        latitude: 39.1092111026677,
        longitude: -84.5152077641052,
        radius: 1,
        zoom: 14
      }
    };

    this.driver = neo4j.driver(
      process.env.REACT_APP_NEO4J_URI,
      neo4j.auth.basic(
        process.env.REACT_APP_NEO4J_USER,
        process.env.REACT_APP_NEO4J_PASSWORD
      ),
    );
    this.fetchSingleFamily();
    // this.fetchCategories();
  }

  onFocusChange = focusedInput => this.setState({ focusedInput });

  businessSelected = s => {
    this.setState({
      selectedBusiness: s
    });
  };

  mapSearchPointChange = viewport => {
    this.setState({
      mapCenter: {
        ...this.state.mapCenter,
        latitude: viewport.latitude,
        longitude: viewport.longitude,
        zoom: viewport.zoom
      }
    });
  };

  // fetchCategories = () => {
  //   const { mapCenter } = this.state;
  //   const session = this.driver.session();

  //   session
  //     .run(
  //       `MATCH (s:SINGLE_FAMILY)
  //       WHERE distance(s.location, point({latitude: $lat, longitude: $lon})) < ($radius * 1000)
  //       WITH DISTINCT s

  //       WITH c.name AS cat, COUNT(s) AS num ORDER BY num DESC
  //       RETURN COLLECT({id: cat, label: cat, value: toFloat(num)}) AS categoryData
  //   `,
  //       {
  //         lat: mapCenter.latitude,
  //         lon: mapCenter.longitude,
  //         radius: mapCenter.radius
  //       }
  //     )
  //     .then(result => {
  //       console.log(result);
  //       const categoryData = result.records[0].get("categoryData");
  //       this.setState({
  //         categoryData
  //       });
  //       session.close();
  //     })
  //     .catch(e => {
  //       console.log(e);
  //       session.close();
  //     });
  // };

  fetchSingleFamily = () => {
    const { mapCenter } = this.state;
    const session = this.driver.session();
    session
      .run(
        `
        MATCH (s:SINGLE_FAMILY)-[:APPRAISES_AT]->(v:VALUE)
        WHERE distance(s.location, point({latitude: $lat, longitude: $lon})) < ($radius * 1000)
        WITH COLLECT({parcel_number:s.parcel_number, location:s.location, abatement_value:toFloat(v.abatement_value), total_value:toFloat(v.total_value)}) AS singleFamily, COLLECT(toFloat(v.abatement_value)) AS abatedlist, 
        SUM(toFloat(v.total_value)) AS totalvalue, AVG(toFloat(v.abatement_value)) AS avgabate, SUM(toFloat(v.abatement_value)) AS totalabate
        RETURN singleFamily,avgabate,totalvalue,totalabate`,
        {
          lat: mapCenter.latitude,
          lon: mapCenter.longitude,
          radius: mapCenter.radius
        }
      )
      .then(result => {
        console.log(result);
        const record = result.records[0];
        const singleFamily = record.get("singleFamily");
        const avgAbate = record.get("avgabate");
        const totalValue = record.get("totalvalue");
        const totalAbate = record.get("totalabate");

        this.setState({
          singleFamily,
          avgAbate,
          totalValue,
          totalAbate
        });
        session.close();
      })
      .catch(e => {
        // TODO: handle errors.
        console.log(e);
        session.close();
      });
  };

  componentDidUpdate = (prevProps, prevState) => {
    if (
      this.state.mapCenter.latitude !== prevState.mapCenter.latitude ||
      this.state.mapCenter.longitude !== prevState.mapCenter.longitude
    ) {
      this.fetchSingleFamily();
      // this.fetchCategories();
    }
    if (
      this.state.selectedBusiness &&
      (!prevState.selectedBusiness ||
        this.state.selectedBusiness.id !== prevState.selectedBusiness.id ||
        false ||
        false)
    ) {
    }
  };

  handleSubmit = () => { };

  radiusChange = e => {
    this.setState(
      {
        mapCenter: {
          ...this.state.mapCenter,
          radius: Number(e.target.value)
        }
      },
      () => {
        this.fetchSingleFamily();
        // this.fetchCategories();
      }
    );
  };

  render() {
    return (
      <div id="app-wrapper">
        <div id="app-toolbar">
          <form action="" onSubmit={this.handleSubmit}>
            <div className="row tools">
              <div className="col-sm-2">
                <div className="tool radius">
                  <h5>Query Radius</h5>
                  <input
                    type="number"
                    id="radius-value"
                    className="form-control"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={this.state.mapCenter.radius}
                    onChange={this.radiusChange}
                  />
                  <select className="form-control" id="radius-suffix">
                    <option value="km">km</option>
                  </select>
                </div>
              </div>

              <div className="col-sm-2">
                <div className="tool coordinates">
                  <h5>Latitude</h5>
                  <input
                    type="number"
                    step="any"
                    id="coordinates-lat"
                    className="form-control"
                    placeholder="Latitude"
                    value={this.state.mapCenter.latitude}
                    onChange={() => (true)}
                  />
                </div>
              </div>

              <div className="col-sm-2">
                <div className="tool coordinates">
                  <h5>Longitude</h5>
                  <input
                    type="number"
                    step="any"
                    id="coordinates-lng"
                    className="form-control"
                    placeholder="Longitude"
                    value={this.state.mapCenter.longitude}
                    onChange={() => true}
                  />
                </div>
              </div>

              {/* <div className="col-sm-2">
                <div className="tool timeframe">
                  <h5>Start Date</h5>
                  <input
                    type="date"
                    id="timeframe-start"
                    className="form-control"
                    placeholder="mm/dd/yyyy"
                    value={this.state.startDate.format("YYYY-MM-DD")}
                    onChange={this.dateChange}
                  />
                </div>
              </div> */}

              {/* <div className="col-sm-2">
                <div className="tool timeframe">
                  <h5>End Date</h5>
                  <input
                    type="date"
                    id="timeframe-end"
                    className="form-control"
                    placeholder="mm/dd/yyyy"
                    value={this.state.endDate.format("YYYY-MM-DD")}
                    onChange={this.dateChange}
                  />
                </div>
              </div> */}

              <div className="col-sm-4">
                <div className="tool">
                  <h5>Data Downloaded From The</h5>
                  <span><a href="https://www.hamiltoncountyauditor.org">Hamilton County Auditor Website</a></span>
                  {/* <button id="refresh" className="btn btn-primary btn-block">
                    Refresh
                  </button> */}
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="chart-wrapper">
          <div id="app-maparea">
            <Map
              mapSearchPointChange={this.mapSearchPointChange}
              mapCenter={this.state.mapCenter}
              singleFamily={this.state.singleFamily}
              businessSelected={this.businessSelected}
              selectedBusiness={this.state.selectedBusiness}
            />
          </div>
        </div>

        <div id="app-sidebar">
          <br />
          <div>
            <ul>
              <li>
                <strong>Average Abatement Value: </strong> ${this.state.avgAbate.toLocaleString()}
              </li>
              <li>
                <strong>Total Abatement Value: </strong> ${this.state.totalAbate.toLocaleString()}
              </li>
              <li>
                <strong>Total Value of Selected Properties: </strong> ${this.state.totalValue.toLocaleString()}
              </li>
            </ul>
          </div>
          {/* <div id="chart-02">
            <div className="chart-wrapper">
              <div className="chart-title">Review Star Summary</div>
              <div className="chart-stage">
                <ReviewSummary
                  singleFamily={this.state.singleFamily}
                  starsData={this.state.starsData}
                />
              </div>
              <div className="chart-notes">
                Review stars for businesses in the selected radius and date
                range.
              </div>
            </div>
          </div> */}
          <br />
          <div id="chart-03">
            {/* <div className="chart-wrapper">
              <div className="chart-title">Category Summary</div>
              <div className="chart-stage">
                <CategorySummary categoryData={this.state.categoryData} />
              </div>
              <div className="chart-notes">
                Business category breakdown for businesses in the selected
                radius with reviews in the date range.
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
