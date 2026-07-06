/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_78646011")

  // remove field
  collection.fields.removeById("select1670550106")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_78646011")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1670550106",
    "maxSelect": 1,
    "name": "officer_type",
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
})
