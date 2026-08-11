import os
import requests
import json

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

users_to_create = [
    {"email": "lucas@example.com", "password": "Lx7!qP92#vK4", "role": "admin"},
    {"email": "caitano@example.com", "password": "Ct5@Nw83!rZ6", "role": "admin"},
    {"email": "funcionario@example.com", "password": "Fn9#Kb27@xM5", "role": "funcionario"}
]

for u in users_to_create:
    # 1. Create or Get User
    print(f"Processing {u['email']}...")
    payload = {
        "email": u["email"],
        "password": u["password"],
        "email_confirm": True
    }
    
    # Try to create user
    resp = requests.post(f"{url}/auth/v1/admin/users", headers=headers, json=payload)
    user_id = None
    
    if resp.status_code == 201:
        user_id = resp.json()["id"]
        print(f"  User created: {user_id}")
    elif resp.status_code == 422: # Already exists probably
        # List users to find ID
        list_resp = requests.get(f"{url}/auth/v1/admin/users", headers=headers)
        if list_resp.status_code == 200:
            for existing_user in list_resp.json()["users"]:
                if existing_user["email"] == u["email"]:
                    user_id = existing_user["id"]
                    print(f"  User already exists: {user_id}. Updating password.")
                    # Update password
                    requests.put(f"{url}/auth/v1/admin/users/{user_id}", headers=headers, json={"password": u["password"]})
                    break
    else:
        print(f"  Error creating user {u['email']}: {resp.status_code} {resp.text}")
        continue

    if not user_id:
        print(f"  Could not determine ID for {u['email']}")
        continue

    # 2. Assign Role and Permissions in public tables
    # Clean up first
    requests.post(f"{url}/rest/v1/rpc/exec_sql", headers=headers, json={"sql": f"DELETE FROM public.user_roles WHERE user_id = '{user_id}';"})
    requests.post(f"{url}/rest/v1/rpc/exec_sql", headers=headers, json={"sql": f"DELETE FROM public.user_permissions WHERE user_id = '{user_id}';"})

    # Assign Role
    role_payload = {"user_id": user_id, "role": u["role"]}
    role_resp = requests.post(f"{url}/rest/v1/user_roles", headers=headers, json=role_payload)
    print(f"  Role '{u['role']}' assigned: {role_resp.status_code}")

    # Assign Permissions
    if u["role"] == "admin":
        perms = ["produtos.manage", "solicitacoes.manage", "auditoria.view", "backup.manage", "usuarios.manage", "pedidos.view"]
    else:
        # Funcionario only gets products and orders by default as per common sense + restricted request
        # The user said "apenas com permissões de funcionário", which usually implies NO admin-only perms like users/backup/audit
        perms = ["produtos.manage", "pedidos.view", "solicitacoes.manage"]
    
    perms_payload = [{"user_id": user_id, "permission": p} for p in perms]
    perms_resp = requests.post(f"{url}/rest/v1/user_permissions", headers=headers, json=perms_payload)
    print(f"  Permissions assigned: {perms_resp.status_code}")

print("Done.")
