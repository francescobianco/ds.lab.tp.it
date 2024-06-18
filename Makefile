
start:
	@docker compose up -d --build --force-recreate
	@echo
	@echo "Admin: <http://localhost:4567/_/>"

bash:
	@docker compose exec pocketbase sh

test-login:
	@docker run $$(pwd)/tests:/tests javanile/selenium-test /tests/login.py
