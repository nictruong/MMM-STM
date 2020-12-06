const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const fetch = require('node-fetch');
const moment = require('moment');

var request = require('request');

const fetchSTMData = async (type) => {
	const url = `https://api.stm.info/pub/od/gtfs-rt/ic/v1/${type}`;
	const res = await fetch(url, {
		method: 'POST',
		encoding: null,
		headers: {
			apikey: 'l7xx877e00aec7a74456922a9c3eb4e4b4d0',
		},
	});

	const stmDataCoded = await res.buffer();
	const stmData = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
		stmDataCoded
	);

	return stmData;
};

const parseDataByRouteStopId = (stmData, stops) => {
	const stopIds = stops.map((stop) => stop.stopId);
	const routeIds = stops.map((stop) => stop.routeId);

	console.log(stopIds);
	console.log(routeIds);

	const data = stmData.entity
		.map((entity) => entity.tripUpdate)
		.filter((entity) => routeIds.includes(entity.trip.routeId))
		.map((entity) => ({
			routeId: entity.trip.routeId,
			stopTimeUpdates: entity.stopTimeUpdate,
		}))
		.flatMap((entity) =>
			entity.stopTimeUpdates.map((stopTimeUpdate) => ({
				arrival: stopTimeUpdate.arrival,
				stopId: stopTimeUpdate.stopId,
				routeId: entity.routeId,
			}))
		)
		.filter((stopTimeUpdate) => stopIds.includes(stopTimeUpdate.stopId))
		.reduce((result, stopTimeUpdate) => {
			const id = `${stopTimeUpdate.routeId}-${stopTimeUpdate.stopId}`;
			if (result[id]) {
				console.log('hello');
				result[id] = result[id].concat(stopTimeUpdate);
			} else {
				result[id] = [stopTimeUpdate];
			}

			return result;
		}, {});

	return stops.map((info) => data[`${info.routeId}-${info.stopId}`]);
};

const main = async (stops) => {
	const stmData = await fetchSTMData('tripUpdates');
	const parsedData = parseDataByRouteStopId(stmData, stops);

	console.log(parsedData);

	// console.log(
	// 	parsedData[0].forEach((stopTimeUpdate) =>
	// 		moment(stopTimeUpdate.arrival.time).fromNow()
	// 	)
	// );
};

main([{ stopId: '51053', routeId: '31' }]);
