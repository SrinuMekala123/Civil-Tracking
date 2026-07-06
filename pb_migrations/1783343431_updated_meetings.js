/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_78646011")

  // add field
  collection.fields.addAt(18, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_742067620",
    "hidden": false,
    "id": "relation3816602426",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "cadre_officer_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_78646011")

  // remove field
  collection.fields.removeById("relation3816602426")

  return app.save(collection)
})
