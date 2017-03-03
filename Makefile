MODULES = index.js

LIBS = $(wildcard src/lib/*.js) src/actions.js src/selectors.js

index.js: src/index.js $(LIBS)
	@echo "Makefile: build module $@"
	@rollup -c rollup.config.js $< >$@

%.js: src/%.js
	@echo "Makefile: build module $@"
	@rollup -c rollup.config.js $< >$@

js: $(MODULES)

clean:
	@echo "Makefile: clean module artifacts"
	@rm -f $(MODULES)
