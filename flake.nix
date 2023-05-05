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
				erlangVersion = "erlangR24";
				# Set the Elixir version
				elixirVersion = "elixir_1_13";
				erlang = pkgs.beam.interpreters.${erlangVersion};
				elixir = pkgs.beam.packages.${erlangVersion}.${elixirVersion};
				elixir_ls = pkgs.beam.packages.${erlangVersion}.elixir_ls;

				inherit (pkgs.lib) optional optionals;
				inherit (pkgs.devshell) mkShell;

				fileWatchers = with pkgs; (optional stdenv.isLinux inotify-tools
				++ optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
					CoreFoundation
					CoreServices
				]));
			in rec {
				# TODO: Add your Elixir package
				# packages = flake-utils.lib.flattenTree {
				# } ;

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
								elixir_ls
								pkgs.nodejs-14_x
								pkgs.entr
								pkgs.lcov
							]
							++ fileWatchers;

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
