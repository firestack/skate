{
	description = "Skate: Gliding on Wheels";

	inputs = {
		beam-flakes = {
			url = "github:shanesveller/nix-beam-flakes";
			inputs.flake-parts.follows = "flake-parts";
			inputs.nixpkgs.follows = "nixpkgs";
		};
		flake-parts.url = "github:hercules-ci/flake-parts";
		devshell.url = "github:numtide/devshell";
		devshell.inputs.nixpkgs.follows = "/nixpkgs";
		nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
	};

	outputs = inputs @ {
		beam-flakes,
		flake-parts,
		devshell,
		...
	}:
		flake-parts.lib.mkFlake {inherit inputs;} {
			imports = [
				beam-flakes.flakeModule
				devshell.flakeModule
			];

			systems = ["aarch64-darwin" "x86_64-darwin" "x86_64-linux"];

			perSystem = { config, pkgs, lib, ... }: {
				beamWorkspace = {
					devShell = {
						languageServers.elixir = true;
						languageServers.erlang = false;
						phoenix = true;
						extraPackages = [
							pkgs.nodejs_20
							pkgs.adrgen
							pkgs.entr
						];
					};
					versions = {
						fromToolVersions = ./.tool-versions;
					};
				};

				devshells.default = let
						cfg = config.beamWorkspace; 
				in {
					packages = cfg.devShell.packages ++ cfg.devShell.extraPackages ++ [
						pkgs.postgresql_15
					]; 
					env = [{
						name = "ERL_AFLAGS";
						value =
							if cfg.devShell.iexShellHistory
								then "-kernel shell_history enabled"
								else null;
					}];
					
					commands = [{ name = "init-postgres"; command = lib.concatLines [
						"initdb pgdata;"
						"chmod -R 700 pgdata;"
						"echo -e \"Use the devshell command 'database:start'\""
					]; }];

					serviceGroups.skate.services = {
						postgres.command = "postgres -D ./pgdata";
						phoenix.command = "mix phx.server";
					};
				};
			};
		};
}
