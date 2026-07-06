/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_78646011")

  // add field
  collection.fields.addAt(17, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2698081619",
    "hidden": false,
    "id": "relation229463005",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "ias",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_78646011")

  // remove field
  collection.fields.removeById("relation229463005")

  return app.save(collection)
})
