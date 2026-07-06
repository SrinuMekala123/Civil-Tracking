/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2698081619")

  // add field
  collection.fields.addAt(26, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_742067620",
    "hidden": false,
    "id": "relation1670550106",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "officer_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2698081619")

  // remove field
  collection.fields.removeById("relation1670550106")

  return app.save(collection)
})
