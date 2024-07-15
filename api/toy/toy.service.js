import { ObjectId } from 'mongodb'

import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

export const toyService = {
	remove,
	query,
	getById,
	add,
	update,
	addToyMsg,
	removeToyMsg,
}

async function query(filterBy = { toyName: '' }, sortBy) {
	try {
		console.log('filterBy :', filterBy)
		// const filterCriteria = {
		// 	toyName: { $regex: filterBy.toyName, $options: 'i' },
		// 	labels: { $all: filterBy.labels },
		// }

		// if (filterBy.inStock === 'true') {
		// 	filterCriteria.inStock = true
		// } else if (filterBy.inStock === 'false') {
		// 	filterCriteria.inStock = false
		// }
		const filterCriteria = _handleFillterCriteria(filterBy)
		const sortCriteria = _handleSortCriteria(sortBy);

		const collection = await dbService.getCollection('toy')
		var toys = await collection.find(filterCriteria).sort(sortCriteria).toArray();

		return toys

	} catch (err) {
		logger.error('cannot find toys', err)
		throw err
	}
}

async function getById(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const toy = await collection.findOne({ _id: ObjectId.createFromHexString(toyId) })
		toy.createdAt = toy._id.getTimestamp()
		return toy
	} catch (err) {
		logger.error(`while finding toy ${toyId}`, err)
		throw err
	}
}

async function remove(toyId) {
	try {
		const collection = await dbService.getCollection('toy')
		const { deletedCount } = await collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
		return deletedCount
	} catch (err) {
		logger.error(`cannot remove toy ${toyId}`, err)
		throw err
	}
}

async function add(toy) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.insertOne(toy)
		return toy
	} catch (err) {
		logger.error('cannot insert toy', err)
		throw err
	}
}

async function update(toy) {
	try {
		const toyToSave = {
			vendor: toy.vendor,
			price: toy.price,
		}
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toy._id) }, { $set: toyToSave })
		return toy
	} catch (err) {
		logger.error(`cannot update toy ${toyId}`, err)
		throw err
	}
}

async function addToyMsg(toyId, msg) {
	try {
		msg.id = utilService.makeId()

		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $push: { msgs: msg } })
		return msg
	} catch (err) {
		logger.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}

async function removeToyMsg(toyId, msgId) {
	try {
		const collection = await dbService.getCollection('toy')
		await collection.updateOne({ _id: ObjectId.createFromHexString(toyId) }, { $pull: { msgs: { id: msgId } } })
		return msgId
	} catch (err) {
		logger.error(`cannot add toy msg ${toyId}`, err)
		throw err
	}
}

function _handleSortCriteria(sortBy) {
	const sortCriteria = {};

	if (sortBy) {
		// sortBy.order = 1 //default
		switch (sortBy.sort) {
			case 'createdAt':
				sortCriteria.createdAt = sortBy.order === -1 ? -1 : 1;
				break;
			case 'price':
				sortCriteria.price = sortBy.order === -1 ? -1 : 1;
				break;
			case 'toyName':
				sortCriteria.toyName = sortBy.order === -1 ? -1 : 1;
				break;
			default:
				sortCriteria.createdAt = 1; // Default to sorting by createdAt ascending
				break;
		}
	} else {
		sortCriteria.price = 1; // Default to sorting by createdAt ascending
	}

	return sortCriteria;
}

function _handleFillterCriteria(filterBy) {
	const filterCriteria =
	{
		toyName: { $regex: filterBy.toyName, $options: 'i' },
	}

	if (filterBy.labels && filterBy.labels.length) {

		filterCriteria.labels = { $all: filterBy.labels }
	}
	if (filterBy.inStock === 'true') {
		filterCriteria.inStock = true
	} else if (filterBy.inStock === 'false') {
		filterCriteria.inStock = false
	}

	return filterCriteria

}
