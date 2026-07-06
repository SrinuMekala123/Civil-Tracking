/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  collection.listRule = '@request.auth.role = "Super Admin" || @request.auth.role = "Admin" || id = @request.auth.id'
  collection.viewRule = '@request.auth.role = "Super Admin" || @request.auth.role = "Admin" || id = @request.auth.id'

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  collection.listRule = 'id = @request.auth.id'
  collection.viewRule = 'id = @request.auth.id'

  return app.save(collection)
})
