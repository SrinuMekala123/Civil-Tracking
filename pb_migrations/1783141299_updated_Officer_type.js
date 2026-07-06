/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_742067620")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "select2526896723",
    "maxSelect": 1,
    "name": "officetype",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "IAS",
      "IPS"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_742067620")

  // remove field
  collection.fields.removeById("select2526896723")

  return app.save(collection)
})
