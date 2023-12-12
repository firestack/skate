{
	description = "A Phoenix project";

	inputs = {
		pre-commit-hooks = {
			url = "github:cachix/pre-commit-hooks.nix";
			inputs.nixpkgs.follows = "/nixpkgs";
			inputs.flake-utils.follows = "/flake-utils";
		};

		striptabs = {
			url = "github:firestack/striptabs";
			inputs.nixpkgs.follows = "/nixpkgs";
		};

		devshell = {
			url = "github:numtide/devshell";
			inputs.nixpkgs.follows = "/nixpkgs";
			inputs.flake-utils.follows = "/flake-utils";
		};
	};

	outputs = {
		self,
		nixpkgs,
		flake-utils,
		pre-commit-hooks,
		striptabs,
		devshell,
	}:
		flake-utils.lib.eachSystem [
			# TODO: Configure your supported system here.
			"x86_64-linux"
			"aarch64-linux"
			"i686-linux"
			"x86_64-darwin"
			"aarch64-darwin"
		]
		(
			system: let
				pkgs = import nixpkgs {
					inherit system;
					overlays = [
						devshell.overlays.default
					];
				};

				# Set the Erlang version
				erlangVersion = "erlangR26";
				# Set the Elixir version
				elixirVersion = "elixir_1_15";

				erlangPackages = pkgs.beam.packages.${erlangVersion};
				elixir = erlangPackages.${elixirVersion};
				inherit (erlangPackages) erlang elixir-ls rebar3 hex;

				inherit (pkgs.lib) optional optionals;
				inherit (pkgs.devshell) mkShell;

				fileWatchers = with pkgs; (optional stdenv.isLinux inotify-tools
				++ optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
					CoreFoundation
					CoreServices
				]));
				version = "0.1.0";
			in {
				packages = rec {
					# default = skate;
					# skate =
					mixDependencies = erlangPackages.fetchMixDeps {
						pname = "mix-deps-skate";
						mixEnv = "";
						inherit version;
						src = self;
						# sha256 = "sha256-gH0pGRCuiJRJnbNYb78UvofvlHsmHoFEGCwRFQ9/Uv4=";
						sha256 = "sha256-TfHcfgVmE1EBci++uBKXy4q33SxEMhG4ER7J2t8GzU0=";
					};


					skate-release = erlangPackages.mixRelease {
						pname = "skate-release";
						src = ./.;
						version = "0.1.0";

						# inherit mixNixDeps;
						mixNixDeps = import ./deps.nix { inherit (nixpkgs) lib; inherit (erlangPackages) beamPackages; };
					};
				};

				checks = {
					pre-commit-check = pre-commit-hooks.lib.${system}.run {
						src = ./.;
						hooks = {
							nixpkgs-fmt.enable = true;
							nix-linter.enable = true;
							# TODO: Add a linter for Elixir
						};
					};
				};
				devShells = rec {
					default = skate-env;
					skate-env = mkShell {
						packages = [
								erlang
								elixir
								elixir-ls
								rebar3
								hex
								pkgs.nodejs_20
								pkgs.entr
								pkgs.lcov
							]
							++ fileWatchers;

						imports = [ "${devshell}/extra/git/hooks.nix" ];

						git.hooks.enable = true;
						git.hooks.pre-commit.text = striptabs.fn ''
							mix format --check-formatted
							mix compile --force --warnings-as-errors
							mix test
							mix credo
							mix dialyzer
							npm --prefix=assets check
							npm --prefix=assets test
						'';
						# inherit (self.checks.${system}.pre-commit-check) shellHook;

						env = let
							fn = attrs: nixpkgs.lib.attrsets.mapAttrsToList (nixpkgs.lib.nameValuePair) attrs;
						in fn {
							LANG = "C.UTF-8";
							ERL_AFLAGS = "-kernel shell_history enabled";
						};
					};

					# default = asdf;
					skate-asdf = asdf;
					asdf = mkShell {
						packages = [
							pkgs.asdf-vm
						];

						devshell.startup.asdf.text = striptabs.fn ''
							source ${pkgs.asdf-vm}/share/asdf-vm/asdf.sh
						'';
					};
				};
			}
		);
}
